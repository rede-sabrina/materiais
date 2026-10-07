import { Router } from "express";
import authRoutes from "./auth.routes.js";
import returnsRoutes from "./returns.routes.js";
import productsRoutes from "./products.routes.js";
import uploadsRoutes from "./uploads.routes.js";
import usersRoutes from "./users.routes.js";
import reportsRoutes from "./reports.routes.js";
import jobsRoutes from "./jobs.routes.js";
import ordersRoutes from "./orders.routes.js";
import auditRoutes from "./audit.routes.js";
import fernandoOrdersRoutes from "./fernandoOrders.routes.js";
import fernandoUploadsRoutes from "./fernandoUploads.routes.js";

const router = Router()

router.use('/auth', authRoutes)
router.use('/returns', returnsRoutes)
router.use('/orders', ordersRoutes)
router.use('/fernando-orders', fernandoOrdersRoutes)
router.use('/fernando-uploads', fernandoUploadsRoutes)
router.use('/products', productsRoutes)
router.use('/uploads', uploadsRoutes)
router.use('/users', usersRoutes)
router.use('/reports', reportsRoutes)
router.use('/jobs', jobsRoutes)
router.use('/audit', auditRoutes)

export default router