import { Router } from 'express'
import { listProducts, getProduct } from '../controllers/products.controller.js'

const router = Router()

router.get('/', listProducts)
router.get('/:ean', getProduct)

export default router
