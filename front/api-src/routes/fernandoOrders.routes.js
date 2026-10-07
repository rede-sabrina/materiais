import { Router } from 'express'
import {
  listFernandoOrders,
  getFernandoOrder,
  createNewFernandoOrder,
  patchFernandoOrder,
  changeFernandoOrderStatus,
  registerAutorizadoPor,
  deleteFernandoOrderCtrl,
  getFernandoDashboardStats,
  getStoreFernandoOrders
} from '../controllers/fernandoOrders.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = Router()

// Middleware que garante que só Fernando ou Admin passam
const fernandoMiddleware = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Acesso não autorizado' })
  if (req.user.role !== 'FERNANDO' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito ao Fernando' })
  }
  next()
}

// Todas as rotas exigem autenticação
router.use(authMiddleware)

// Dashboard stats — Fernando/Admin
router.get('/dashboard/stats', fernandoMiddleware, getFernandoDashboardStats)

// Pedidos da loja logada (/minhas)
router.get('/minhas', getStoreFernandoOrders)

// Qualquer usuário autenticado pode criar e ver seus pedidos
router.get('/', listFernandoOrders)
router.post('/', createNewFernandoOrder)
router.get('/:id', getFernandoOrder)
router.delete('/:id', deleteFernandoOrderCtrl)

// Apenas Fernando/Admin podem atualizar status e registrar autorizador
router.patch('/:id/status', fernandoMiddleware, changeFernandoOrderStatus)
router.patch('/:id/autorizar', fernandoMiddleware, registerAutorizadoPor)
router.patch('/:id', fernandoMiddleware, patchFernandoOrder)

export default router