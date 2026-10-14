import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import fernandoProductsAccess from '../middlewares/fernandoProducts.middleware.js'
import { addFernandoProduct, listFernandoProducts, removeFernandoProduct } from '../controllers/fernandoProducts.controller.js'

const router = Router()
router.use(authMiddleware)
router.use(fernandoProductsAccess)
router.get('/', listFernandoProducts)
router.post('/', addFernandoProduct)
router.delete('/:id', removeFernandoProduct)
export default router
