import { Router } from 'express'
import { runOverdueJob } from '../controllers/jobs.controller.js'

const router = Router()

router.get('/overdue', runOverdueJob)

export default router
