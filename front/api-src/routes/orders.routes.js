import { Router } from 'express'
import { listOrders, getOrder, createNewOrder, patchOrder, changeStatus, deleteOrderCtrl } from '../controllers/orders.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import adminMiddleware from '../middlewares/admin.middleware.js'

const router = Router()

// Any logged‑in user can create and list its own orders
router.use(authMiddleware)
router.get('/', listOrders)
router.post('/', createNewOrder)
router.get('/:id', getOrder) // view order (owner or admin)
router.delete('/:id', deleteOrderCtrl) // owner or admin can delete

// Admin can change status
router.use(adminMiddleware)
router.patch('/:id', patchOrder)
router.patch('/:id/status', changeStatus)

export default router
