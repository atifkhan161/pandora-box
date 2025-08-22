import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger.js'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name

    // This clips the constructor invocation from the stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
    this.name = 'ExternalServiceError'
  }
}

// Error response interface
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
    stack?: string
  }
}

// Main error handler middleware
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = error.statusCode || 500
  let code = error.code || 'INTERNAL_ERROR'
  let message = error.message || 'Internal server error'

  // Log error details
  const errorInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    }
  }

  // Log based on error severity
  if (statusCode >= 500) {
    logger.error('Server Error:', errorInfo)
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', errorInfo)
  } else {
    logger.info('Request Error:', errorInfo)
  }

  // Handle specific error types
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Invalid input data'
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'INVALID_TOKEN'
    message = 'Invalid authentication token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'TOKEN_EXPIRED'
    message = 'Authentication token expired'
  } else if (error.name === 'MongoError' && error.code === 11000) {
    statusCode = 409
    code = 'DUPLICATE_RESOURCE'
    message = 'Resource already exists'
  } else if (error.name === 'MulterError') {
    statusCode = 400
    code = 'FILE_UPLOAD_ERROR'
    message = 'File upload error'
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack
  }

  // Add validation details if available
  if (error.name === 'ValidationError' && (error as any).details) {
    errorResponse.error.details = (error as any).details
  }

  // Send error response
  res.status(statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`)
  next(error)
}

// Validation error handler
export const validationErrorHandler = (errors: any[]): void => {
  const message = errors.map(error => error.message).join(', ')
  throw new ValidationError(message)
}

// Custom error factory functions
export const createError = {
  validation: (message: string, field?: string) => new ValidationError(message, field),
  authentication: (message?: string) => new AuthenticationError(message),
  authorization: (message?: string) => new AuthorizationError(message),
  notFound: (message?: string) => new NotFoundError(message),
  conflict: (message?: string) => new ConflictError(message),
  rateLimit: (message?: string) => new RateLimitError(message),
  externalService: (service: string, message?: string) => new ExternalServiceError(service, message),
  internal: (message: string) => new AppError(message, 500, 'INTERNAL_ERROR')
}

// Helper function to check if error is operational
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export default errorHandler