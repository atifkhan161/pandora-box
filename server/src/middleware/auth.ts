import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};