import { Router } from 'express'
import { listUsers, createUser, updateUserRole, deleteUser, updateUser } from '../controllers/users.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import adminOnly from '../middlewares/admin.middleware.js'

const router = Router()

// all management routes require auth + admin
router.get('/', authMiddleware, adminOnly, listUsers)
router.post('/', authMiddleware, adminOnly, createUser)
router.patch('/:id/role', authMiddleware, adminOnly, updateUserRole)
router.patch('/:id', authMiddleware, adminOnly, updateUser)
router.delete('/:id', authMiddleware, adminOnly, deleteUser)

export default router
