import { Router } from 'express'
import { listOrders, getOrder, createNewOrder, patchOrder, changeStatus } from '../controllers/orders.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { adminMiddleware } from '../middlewares/admin.middleware.js'

const router = Router()

// Any logged‑in user can create and list its own orders
router.use(authMiddleware)
router.get('/', listOrders)
router.post('/', createNewOrder)

// Admin can view any order and change status
router.use(adminMiddleware)
router.get('/:id', getOrder)
router.patch('/:id', patchOrder)
router.patch('/:id/status', changeStatus)

export default router
