import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUsers, getActivityLogs } from '../services/database';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;
    
    const users = getUsers();
    const user = users.findOne({ username });
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      } as ApiResponse);
    }
    
    const tokenExpiry = rememberMe ? '90d' : '24h';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiry }
    );
    
    // Log activity
    const activityLogs = getActivityLogs();
    activityLogs.insert({
      id: uuidv4(),
      userId: user.id,
      action: 'login',
      details: { rememberMe },
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    logger.info(`User ${username} logged in`);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      } as ApiResponse);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const users = getUsers();
    const user = users.findOne({ id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }
    
    const newToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '90d' }
    );
    
    res.json({
      success: true,
      data: { token: newToken }
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    } as ApiResponse);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Log activity
    const activityLogs = getActivityLogs();
    activityLogs.insert({
      id: uuidv4(),
      userId: (req as any).user?.userId,
      action: 'logout',
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};