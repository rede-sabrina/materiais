import { Router } from 'express'
import {
  listProducts,
  getProduct,
  createProductSimple,
  deactivateProduct,
  activateProduct,
  updateProductCtrl,
  deleteProductCtrl
} from '../controllers/products.controller.js'

const router = Router()

router.get('/', listProducts)                     // GET  /api/products
router.get('/:ean', getProduct)                // GET  /api/products/:ean
router.post('/', createProductSimple)          // POST /api/products  (admin UI)
router.patch('/:codigo', deactivateProduct)    // PATCH /api/products/:codigo  (desativar)
router.patch('/:codigo/activate', activateProduct)    // PATCH /api/products/:codigo/activate  (ativar)
router.put('/:codigo', updateProductCtrl)      // PUT   /api/products/:codigo  (editar)
router.delete('/:codigo', deleteProductCtrl)   // DELETE /api/products/:codigo  (excluir)

export default router
