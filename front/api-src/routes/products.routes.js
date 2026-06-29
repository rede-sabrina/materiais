import { Router } from 'express'
import { listProducts, getProduct, createProductSimple, deactivateProduct } from '../controllers/products.controller.js'

const router = Router()

router.get('/', listProducts)
router.get('/:ean', getProduct)
router.post('/', createProductSimple)
router.patch('/:codigo', deactivateProduct)


export default router
