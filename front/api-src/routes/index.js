import { Router } from "express";
import authRoutes from "./auth.routes.js";
import returnsRoutes from "./returns.routes.js";
import productsRoutes from "./products.routes.js";
import uploadsRoutes from "./uploads.routes.js";
import usersRoutes from "./users.routes.js";
import reportsRoutes from "./reports.routes.js";
import jobsRoutes from "./jobs.routes.js";
import auditRoutes from "./audit.routes.js";

const router = Router()

router.use('/auth', authRoutes)
router.use('/returns', returnsRoutes)
router.use('/products', productsRoutes)
router.use('/uploads', uploadsRoutes)
router.use('/users', usersRoutes)
router.use('/reports', reportsRoutes)
router.use('/jobs', jobsRoutes)
router.use('/audit', auditRoutes)

export default router