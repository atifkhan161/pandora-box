import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { DatabaseService } from '@/services/database.js'
import AuthService from '@/services/auth.js'
import { createAuthRoutes } from '@/routes/auth.js'
import { initAuthMiddleware } from '@/middleware/auth.js'

describe('Authentication API Integration Tests', () => {
  let app: express.Application
  let dbService: DatabaseService
  let authService: AuthService
  let testUser: any

  beforeAll(async () => {
    // Create test database
    dbService = new DatabaseService(':memory:')
    await dbService.init()

    // Create auth service
    authService = new AuthService(dbService)

    // Create express app
    app = express()
    app.use(express.json())

    // Initialize auth middleware
    initAuthMiddleware(authService)

    // Add auth routes
    const authRoutes = createAuthRoutes(authService, dbService)
    app.use('/auth', authRoutes)

    // Create test user
    testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    }
  })

  afterAll(async () => {
    if (dbService) {
      await dbService.close()
    }
  })

  beforeEach(async () => {
    // Clear users before each test
    const users = await dbService.find('users', {})
    for (const user of users) {
      await dbService.delete('users', user.id)
    }
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully'
      })
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email,
        role: 'user'
      })
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser'
          // Missing email and password
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('validation')
      })
    })

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...testUser,
          password: '123' // Too short
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should prevent duplicate usernames', async () => {
      // Register user first time
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201)

      // Try to register same username
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'different@example.com'
        })
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already exists')
      })
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user before each login test
      await authService.createUser(testUser)
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful'
      })
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      })
    })

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: testUser.password
        })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials')
      })
    })

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username
          // Missing password
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /auth/refresh', () => {
    let validToken: string

    beforeEach(async () => {
      // Create user and get token
      const user = await authService.createUser(testUser)
      validToken = authService.generateToken(user.id)
    })

    it('should refresh valid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          token: validToken
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully'
      })
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.token).not.toBe(validToken) // Should be new token
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          token: 'invalid-token'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should require token field', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /auth/me', () => {
    let user: any
    let token: string

    beforeEach(async () => {
      // Create user and get token
      user = await authService.createUser(testUser)
      token = authService.generateToken(user.id)
    })

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true
      })
      expect(response.body.data).toMatchObject({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      })
      expect(response.body.data).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /auth/logout', () => {
    let user: any
    let token: string

    beforeEach(async () => {
      user = await authService.createUser(testUser)
      token = authService.generateToken(user.id)
    })

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      })
    })

    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200) // Logout is idempotent

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      })
    })
  })

  describe('Authentication Middleware', () => {
    let user: any
    let token: string

    beforeEach(async () => {
      user = await authService.createUser(testUser)
      token = authService.generateToken(user.id)

      // Add a protected route for testing
      app.get('/protected', (req: any, res) => {
        res.json({
          success: true,
          data: {
            message: 'Access granted',
            userId: req.user?.id
          }
        })
      })
    })

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBe(user.id)
    })

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})