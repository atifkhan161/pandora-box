import { Router } from 'express'
import AuthController from '@/controllers/auth.js'
import { authenticate, requireAdmin } from '@/middleware/auth.js'

const router = Router()

// Create a function to initialize routes with database service
export const createAuthRoutes = (dbService: any) => {
  const authController = new AuthController(dbService)

  // Public routes
  router.post('/login', authController.login)
  router.post('/refresh', authController.refresh)

  // Protected routes
  router.post('/logout', authenticate, authController.logout)
  router.get('/verify', authenticate, authController.verify)
  router.get('/profile', authenticate, authController.getProfile)
  router.put('/profile', authenticate, authController.updateProfile)
  router.put('/password', authenticate, authController.changePassword)

  // Admin only routes
  router.post('/register', authenticate, requireAdmin, authController.register)
  router.get('/users', authenticate, requireAdmin, authController.getUsers)
  router.delete('/users/:userId', authenticate, requireAdmin, authController.deleteUser)

  return router
}

export default router