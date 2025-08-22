import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import Joi from 'joi'
import { DatabaseService } from '@/services/database.js'
import { AuthMiddleware } from '@/middleware/auth.js'
import { asyncHandler, ValidationError, AuthenticationError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { User, UserCreateData } from '@/types/database.js'

export class AuthController {
  private dbService: DatabaseService

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
  }

  // Validation schemas
  private loginSchema = Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6),
    rememberMe: Joi.boolean().default(false)
  })

  private registerSchema = Joi.object({
    username: Joi.string().required().min(3).max(50).pattern(/^[a-zA-Z0-9_-]+$/),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    role: Joi.string().valid('admin', 'team').default('team')
  })

  private changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  })

  // User login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.loginSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { username, password, rememberMe } = value
    const ip = req.ip
    const userAgent = req.get('User-Agent') || ''

    // Find user by username or email
    let user = await this.dbService.findUserByUsername(username)
    if (!user) {
      user = await this.dbService.findUserByEmail(username)
    }

    if (!user) {
      logHelpers.logAuthEvent('login_failed_user_not_found', username, ip, userAgent, false)
      throw new AuthenticationError('Invalid username or password')
    }

    // Check if user is active
    if (!user.isActive) {
      logHelpers.logAuthEvent('login_failed_user_inactive', user.id, ip, userAgent, false)
      throw new AuthenticationError('Account is inactive')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      logHelpers.logAuthEvent('login_failed_invalid_password', user.id, ip, userAgent, false)
      throw new AuthenticationError('Invalid username or password')
    }

    // Create session
    const session = await this.dbService.createSession(user.id, rememberMe, ip, userAgent)

    // Update user last login
    await this.dbService.update('users', user.id, {
      lastLogin: new Date().toISOString()
    })

    logHelpers.logAuthEvent('login_success', user.id, ip, userAgent, true)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: session.token,
        refreshToken: session.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        expiresAt: session.expiresAt,
        rememberMe: session.rememberMe
      }
    })
  })

  // User logout
  logout = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      await this.dbService.invalidateSession(token)
      
      if (req.user) {
        logHelpers.logAuthEvent('logout_success', req.user.id, req.ip, req.get('User-Agent'), true)
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    })
  })

  // Verify token
  verify = asyncHandler(async (req: Request, res: Response) => {
    // Token verification is handled by auth middleware
    // If we reach here, token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        session: {
          id: req.session?.id,
          expiresAt: req.session?.expiresAt,
          rememberMe: req.session?.rememberMe
        }
      }
    })
  })

  // Refresh token
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required')
    }

    try {
      // Verify refresh token
      const decoded = AuthMiddleware.verifyRefreshToken(refreshToken)
      
      // Find session
      const session = await this.dbService.findById('sessions', decoded.userId)
      if (!session || session.refreshToken !== refreshToken || !session.isActive) {
        throw new AuthenticationError('Invalid refresh token')
      }

      // Check if refresh token is expired
      if (new Date(session.refreshExpiresAt) < new Date()) {
        await this.dbService.invalidateSession(session.token)
        throw new AuthenticationError('Refresh token expired')
      }

      // Find user
      const user = await this.dbService.findById<User>('users', decoded.userId)
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive')
      }

      // Generate new tokens
      const newToken = AuthMiddleware.generateToken(user.id)
      const newRefreshToken = AuthMiddleware.generateRefreshToken(user.id)

      // Update session
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (session.rememberMe ? 90 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
      const refreshExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

      await this.dbService.update('sessions', session.id, {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresAt.toISOString(),
        refreshExpiresAt: refreshExpiresAt.toISOString(),
        lastAccessedAt: now.toISOString()
      })

      logHelpers.logAuthEvent('token_refresh_success', user.id, req.ip, req.get('User-Agent'), true)

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt: expiresAt.toISOString()
        }
      })

    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      } else {
        logger.error('Token refresh error:', error)
        throw new AuthenticationError('Token refresh failed')
      }
    }
  })

  // Register new user (admin only)
  register = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.registerSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { username, email, password, role } = value

    // Check if username already exists
    const existingUsername = await this.dbService.findUserByUsername(username)
    if (existingUsername) {
      throw new ValidationError('Username already exists')
    }

    // Check if email already exists
    const existingEmail = await this.dbService.findUserByEmail(email)
    if (existingEmail) {
      throw new ValidationError('Email already exists')
    }

    // Create user
    const userData: UserCreateData = {
      username,
      email,
      password,
      role
    }

    const user = await this.dbService.createUser(userData)

    logHelpers.logAuthEvent('user_registered', user.id, req.ip, req.get('User-Agent'), true)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    })
  })

  // Change password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.changePasswordSchema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { currentPassword, newPassword } = value
    const userId = req.user!.id

    // Get current user
    const user = await this.dbService.findById<User>('users', userId)
    if (!user) {
      throw new AuthenticationError('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      logHelpers.logAuthEvent('password_change_failed_invalid_current', userId, req.ip, req.get('User-Agent'), false)
      throw new AuthenticationError('Current password is incorrect')
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await this.dbService.update('users', userId, {
      password: hashedNewPassword
    })

    // Invalidate all existing sessions except current one
    const currentToken = req.headers.authorization?.substring(7)
    if (currentToken) {
      // TODO: Invalidate other sessions
    }

    logHelpers.logAuthEvent('password_change_success', userId, req.ip, req.get('User-Agent'), true)

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  })

  // Get current user profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.dbService.findById<User>('users', req.user!.id)
    if (!user) {
      throw new AuthenticationError('User not found')
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    })
  })

  // Update user profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const schema = Joi.object({
      email: Joi.string().email().optional()
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { email } = value
    const userId = req.user!.id

    // Check if email already exists (if changing email)
    if (email) {
      const existingEmail = await this.dbService.findUserByEmail(email)
      if (existingEmail && existingEmail.id !== userId) {
        throw new ValidationError('Email already exists')
      }
    }

    // Update user
    const updatedUser = await this.dbService.update('users', userId, { email })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser!.id,
          username: updatedUser!.username,
          email: updatedUser!.email,
          role: updatedUser!.role
        }
      }
    })
  })

  // Admin: Get all users
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await this.dbService.find<User>('users', { isActive: true })

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }))
      }
    })
  })

  // Admin: Delete user
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    if (userId === req.user!.id) {
      throw new ValidationError('Cannot delete your own account')
    }

    const user = await this.dbService.findById<User>('users', userId)
    if (!user) {
      throw new ValidationError('User not found')
    }

    // Soft delete - deactivate user
    await this.dbService.update('users', userId, { isActive: false })

    // Invalidate all user sessions
    // TODO: Implement session invalidation for user

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  })
}

export default AuthController