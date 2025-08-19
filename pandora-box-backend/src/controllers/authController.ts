import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUsers, logActivity, User } from '../services/database';
import { logger } from '../utils/logger';

/**
 * Handle user login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const users = getUsers();
    const user = users.findOne({ username });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${username}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    users.update(user);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    const expiresIn = rememberMe ? '90d' : '24h';

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn }
    );

    // Log successful login
    logActivity(user.id, 'login', { rememberMe });
    logger.info(`User ${username} logged in successfully`);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = (req: Request, res: Response): void => {
  try {
    const { id, username, role } = req.user;
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    
    // Generate new token with the same expiry as original token
    const expiresIn = req.user.exp ? req.user.exp - Math.floor(Date.now() / 1000) : '24h';
    
    const token = jwt.sign(
      { id, username, role },
      jwtSecret,
      { expiresIn }
    );

    logActivity(id, 'token_refresh');
    res.status(200).json({ token });
  } catch (error) {
    logger.error('Token refresh error', error);
    res.status(500).json({ error: 'An error occurred during token refresh' });
  }
};

/**
 * Handle user logout
 */
export const logout = (req: Request, res: Response): void => {
  try {
    // In a stateless JWT system, we can't invalidate tokens server-side
    // Client should discard the token
    // We just log the logout event
    if (req.user) {
      logActivity(req.user.id, 'logout');
      logger.info(`User ${req.user.username} logged out`);
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', error);
    res.status(500).json({ error: 'An error occurred during logout' });
  }
};

/**
 * Register a new user (admin only)
 */
export const registerUser = (req: Request, res: Response): void => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Only admins can create users
    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const users = getUsers();
    const existingUser = users.findOne({ username });

    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create new user
    const newUser: User = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      email,
      role: role === 'admin' ? 'admin' : 'user', // Ensure role is valid
      createdAt: new Date()
    };

    users.insert(newUser);
    logActivity(req.user.id, 'user_created', { createdUserId: newUser.id, username });
    logger.info(`New user ${username} created by ${req.user.username}`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email
      }
    });
  } catch (error) {
    logger.error('User registration error', error);
    res.status(500).json({ error: 'An error occurred during user registration' });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const users = getUsers();
    const user = users.findOne({ id: userId });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      logger.warn(`Failed password change attempt for user: ${user.username}`);
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    users.update(user);

    logActivity(userId, 'password_changed');
    logger.info(`Password changed for user ${user.username}`);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Password change error', error);
    res.status(500).json({ error: 'An error occurred during password change' });
  }
};