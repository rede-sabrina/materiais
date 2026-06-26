import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import adminOnly from '../middlewares/admin.middleware.js'
import { listAudit, deleteAudit } from '../controllers/audit.controller.js'

const router = Router()

router.use(authMiddleware)
router.use(adminOnly)

router.get('/', listAudit)
router.delete('/', deleteAudit)

export default router
