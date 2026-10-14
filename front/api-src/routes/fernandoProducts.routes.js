import { Router } from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import fernandoProductsAccess from '../middlewares/fernandoProducts.middleware.js'
import { addFernandoProduct, editFernandoProduct, listFernandoProducts, removeFernandoProduct } from '../controllers/fernandoProducts.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/', listFernandoProducts)
router.post('/', fernandoProductsAccess, addFernandoProduct)
router.put('/:id', fernandoProductsAccess, editFernandoProduct)
router.delete('/:id', fernandoProductsAccess, removeFernandoProduct)
export default router
