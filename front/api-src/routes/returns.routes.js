import { Router } from 'express'
import { listReturns, getReturn, createReturn, updateReturnController, updateStatusController, deleteReturnController } from '../controllers/returns.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = Router()

// protect all returns routes
router.use(authMiddleware)

router.get('/', listReturns)
router.post('/', createReturn)
router.get('/:id', getReturn)
router.put('/:id', updateReturnController)
router.patch('/:id/status', updateStatusController)
router.delete('/:id', deleteReturnController)

export default router
