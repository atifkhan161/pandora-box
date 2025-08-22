import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '@/config/config.js'
import { AuthenticationError, AuthorizationError } from '@/middleware/errorHandler.js'
import { DatabaseService } from '@/services/database.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { User, Session } from '@/types/database.js'

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        email: string
        role: 'admin' | 'team'
      }
      session?: Session
    }
  }
}

export interface JWTPayload {
  userId: string
  type?: string
  iat: number
  exp: number
}

export class AuthMiddleware {
  private dbService: DatabaseService

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
  }

  // Main authentication middleware
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req)
      
      if (!token) {
        logHelpers.logAuthEvent('missing_token', 'unknown', req.ip, req.get('User-Agent'), false)
        throw new AuthenticationError('Authentication token required')
      }

      // Verify JWT token
      const decoded = this.verifyToken(token)
      
      // Find session in database
      const session = await this.dbService.findSessionByToken(token)
      if (!session || !session.isActive) {
        logHelpers.logAuthEvent('invalid_session', decoded.userId, req.ip, req.get('User-Agent'), false)
        throw new AuthenticationError('Invalid or expired session')
      }

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.dbService.invalidateSession(token)
        logHelpers.logAuthEvent('session_expired', decoded.userId, req.ip, req.get('User-Agent'), false)
        throw new AuthenticationError('Session expired')
      }

      // Find user
      const user = await this.dbService.findById<User>('users', decoded.userId)
      if (!user || !user.isActive) {
        logHelpers.logAuthEvent('user_not_found', decoded.userId, req.ip, req.get('User-Agent'), false)
        throw new AuthenticationError('User not found or inactive')
      }

      // Update session last accessed time
      await this.dbService.update('sessions', session.id, {
        lastAccessedAt: new Date().toISOString()
      })

      // Set user and session in request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
      req.session = session

      logHelpers.logAuthEvent('authentication_success', user.id, req.ip, req.get('User-Agent'), true)
      next()

    } catch (error) {
      if (error instanceof AuthenticationError) {
        next(error)
      } else {
        logger.error('Authentication middleware error:', error)
        next(new AuthenticationError('Authentication failed'))
      }
    }
  }

  // Optional authentication (for public endpoints that can benefit from user context)
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req)
      
      if (!token) {
        return next()
      }

      const decoded = this.verifyToken(token)
      const session = await this.dbService.findSessionByToken(token)
      
      if (session && session.isActive && new Date(session.expiresAt) >= new Date()) {
        const user = await this.dbService.findById<User>('users', decoded.userId)
        
        if (user && user.isActive) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
          req.session = session
        }
      }

      next()
    } catch (error) {
      // Ignore authentication errors for optional authentication
      next()
    }
  }

  // Admin role authorization
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required')
    }

    if (req.user.role !== 'admin') {
      logHelpers.logAuthEvent('authorization_failed', req.user.id, req.ip, req.get('User-Agent'), false)
      throw new AuthorizationError('Admin access required')
    }

    next()
  }

  // Role-based authorization
  requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        throw new AuthenticationError('Authentication required')
      }

      if (!roles.includes(req.user.role)) {
        logHelpers.logAuthEvent('authorization_failed', req.user.id, req.ip, req.get('User-Agent'), false)
        throw new AuthorizationError(`Required role: ${roles.join(' or ')}`)
      }

      next()
    }
  }

  // Resource ownership check
  requireOwnership = (userIdField: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        throw new AuthenticationError('Authentication required')
      }

      const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField]
      
      if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
        logHelpers.logAuthEvent('ownership_check_failed', req.user.id, req.ip, req.get('User-Agent'), false)
        throw new AuthorizationError('Access denied: resource ownership required')
      }

      next()
    }
  }

  // Extract token from request
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // Also check query parameter (for WebSocket connections)
    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token
    }

    return null
  }

  // Verify JWT token
  private verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload
      
      if (decoded.type === 'refresh') {
        throw new AuthenticationError('Refresh token cannot be used for authentication')
      }

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token')
      } else {
        throw error
      }
    }
  }

  // Generate JWT token
  static generateToken(userId: string, expiresIn: string = config.auth.jwtExpiry): string {
    return jwt.sign({ userId }, config.auth.jwtSecret, { expiresIn })
  }

  // Generate refresh token
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtRefreshExpiry }
    )
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JWTPayload {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token')
    }

    return decoded
  }
}

// Create middleware instances (will be initialized with database service in app.ts)
let authMiddleware: AuthMiddleware

export const initAuthMiddleware = (dbService: DatabaseService): void => {
  authMiddleware = new AuthMiddleware(dbService)
}

// Export middleware functions
export const authMiddlewareInstance = () => authMiddleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => 
  authMiddleware.authenticate(req, res, next)
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => 
  authMiddleware.optionalAuthenticate(req, res, next)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => 
  authMiddleware.requireAdmin(req, res, next)
export const requireRole = (roles: string[]) => authMiddleware.requireRole(roles)
export const requireOwnership = (userIdField?: string) => authMiddleware.requireOwnership(userIdField)

// Default export for backward compatibility
export default {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireRole,
  requireOwnership
}