import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import AuthService from '@/services/auth.js'
import { DatabaseService } from '@/services/database.js'

// Mock dependencies
jest.mock('jsonwebtoken')
jest.mock('bcryptjs')
jest.mock('@/services/database.js')

const mockJwt = jwt as jest.Mocked<typeof jwt>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const MockDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>

describe('AuthService', () => {
  let authService: AuthService
  let mockDbService: jest.Mocked<DatabaseService>

  beforeEach(() => {
    // Create mock database service
    mockDbService = new MockDatabaseService(':memory:') as jest.Mocked<DatabaseService>
    
    // Create auth service instance
    authService = new AuthService(mockDbService)

    // Reset all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-id'
      const expectedToken = 'test-jwt-token'

      mockJwt.sign.mockReturnValue(expectedToken as any)

      const result = authService.generateToken(userId)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId },
        expect.any(String),
        { expiresIn: '7d' }
      )
      expect(result).toBe(expectedToken)
    })

    it('should use JWT_SECRET from environment', () => {
      const userId = 'test-user-id'
      process.env.JWT_SECRET = 'test-secret'

      authService.generateToken(userId)

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId },
        'test-secret',
        { expiresIn: '7d' }
      )
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = 'valid-token'
      const decodedPayload = { userId: 'test-user-id' }

      mockJwt.verify.mockReturnValue(decodedPayload as any)

      const result = authService.verifyToken(token)

      expect(mockJwt.verify).toHaveBeenCalledWith(
        token,
        expect.any(String)
      )
      expect(result).toEqual(decodedPayload)
    })

    it('should throw error for invalid token', () => {
      const token = 'invalid-token'
      
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      expect(() => {
        authService.verifyToken(token)
      }).toThrow('Invalid token')
    })
  })

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'test-password'
      const hashedPassword = 'hashed-password'

      mockBcrypt.hash.mockResolvedValue(hashedPassword as any)

      const result = await authService.hashPassword(password)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12)
      expect(result).toBe(hashedPassword)
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'test-password'
      const hashedPassword = 'hashed-password'

      mockBcrypt.compare.mockResolvedValue(true as any)

      const result = await authService.comparePassword(password, hashedPassword)

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for non-matching passwords', async () => {
      const password = 'test-password'
      const hashedPassword = 'hashed-password'

      mockBcrypt.compare.mockResolvedValue(false as any)

      const result = await authService.comparePassword(password, hashedPassword)

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })
  })

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'test-password'
      }
      const hashedPassword = 'hashed-password'
      const createdUser = {
        id: 'user-id',
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: 'user',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      mockBcrypt.hash.mockResolvedValue(hashedPassword as any)
      mockDbService.create.mockResolvedValue(createdUser)

      const result = await authService.createUser(userData)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12)
      expect(mockDbService.create).toHaveBeenCalledWith('users', {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: 'user',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
      expect(result).toEqual(createdUser)
    })

    it('should throw error if username already exists', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'test-password'
      }

      mockDbService.findOne.mockResolvedValue({ id: 'existing-user' })

      await expect(authService.createUser(userData)).rejects.toThrow('Username already exists')
    })
  })

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const credentials = {
        username: 'testuser',
        password: 'test-password'
      }
      const storedUser = {
        id: 'user-id',
        username: credentials.username,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user'
      }
      const token = 'jwt-token'

      mockDbService.findOne.mockResolvedValue(storedUser)
      mockBcrypt.compare.mockResolvedValue(true as any)
      mockJwt.sign.mockReturnValue(token as any)

      const result = await authService.authenticateUser(credentials)

      expect(mockDbService.findOne).toHaveBeenCalledWith('users', { username: credentials.username })
      expect(mockBcrypt.compare).toHaveBeenCalledWith(credentials.password, storedUser.password)
      expect(mockJwt.sign).toHaveBeenCalled()
      expect(result).toEqual({
        user: {
          id: storedUser.id,
          username: storedUser.username,
          email: storedUser.email,
          role: storedUser.role
        },
        token
      })
    })

    it('should throw error for invalid username', async () => {
      const credentials = {
        username: 'nonexistent',
        password: 'test-password'
      }

      mockDbService.findOne.mockResolvedValue(null)

      await expect(authService.authenticateUser(credentials)).rejects.toThrow('Invalid credentials')
    })

    it('should throw error for invalid password', async () => {
      const credentials = {
        username: 'testuser',
        password: 'wrong-password'
      }
      const storedUser = {
        id: 'user-id',
        username: credentials.username,
        password: 'hashed-password'
      }

      mockDbService.findOne.mockResolvedValue(storedUser)
      mockBcrypt.compare.mockResolvedValue(false as any)

      await expect(authService.authenticateUser(credentials)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getUserById', () => {
    it('should return user without password', async () => {
      const userId = 'user-id'
      const storedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user'
      }

      mockDbService.findOne.mockResolvedValue(storedUser)

      const result = await authService.getUserById(userId)

      expect(mockDbService.findOne).toHaveBeenCalledWith('users', { id: userId })
      expect(result).toEqual({
        id: storedUser.id,
        username: storedUser.username,
        email: storedUser.email,
        role: storedUser.role
      })
      expect(result).not.toHaveProperty('password')
    })

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent'

      mockDbService.findOne.mockResolvedValue(null)

      const result = await authService.getUserById(userId)

      expect(result).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('should generate new token for valid user', async () => {
      const oldToken = 'old-token'
      const userId = 'user-id'
      const newToken = 'new-token'
      const decodedPayload = { userId }

      mockJwt.verify.mockReturnValue(decodedPayload as any)
      mockJwt.sign.mockReturnValue(newToken as any)

      const result = await authService.refreshToken(oldToken)

      expect(mockJwt.verify).toHaveBeenCalledWith(oldToken, expect.any(String))
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId },
        expect.any(String),
        { expiresIn: '7d' }
      )
      expect(result).toBe(newToken)
    })

    it('should throw error for invalid token', async () => {
      const invalidToken = 'invalid-token'

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authService.refreshToken(invalidToken)).rejects.toThrow('Invalid token')
    })
  })
})