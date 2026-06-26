import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import adminOnly from '../middlewares/admin.middleware.js'
import { summaryReports } from '../controllers/reports.controller.js'

const router = Router()

// all reports endpoints require auth and admin
router.get('/summary', authMiddleware, adminOnly, summaryReports)

export default router
