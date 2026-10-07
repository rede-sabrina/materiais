import {
  getAllFernandoOrders,
  getFernandoOrderById,
  createFernandoOrder,
  updateFernandoOrder,
  updateFernandoOrderStatus,
  setAutorizadoPor,
  deleteFernandoOrder,
  getFernandoOrderStats,
  getRecentPendingOrders
} from '../services/fernandoOrders.service.js'

const VALID_STATUSES = ['Pendente', 'Em andamento', 'Atendido', 'Cancelado']
const VALID_AUTORIZADORES = ['Lucas', 'Adriana', 'Marcelo', 'Supervisor', '']

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rnd = Math.floor(1000 + Math.random() * 9000)
  return `FER-${date}-${rnd}`
}

function isFernandoOrAdmin(user) {
  return user && (user.role === 'FERNANDO' || user.role === 'ADMIN')
}

// ─── Listar pedidos ───────────────────────────────────────────────────────────

export async function listFernandoOrders(req, res, next) {
  try {
    const filter = { ...req.query }
    // Loja só vê seus próprios pedidos
    if (!isFernandoOrAdmin(req.user)) {
      filter.ownerId = req.user.id || req.user._id || req.user.username
    }
    const items = await getAllFernandoOrders(filter)
    res.json(items)
  } catch (err) { next(err) }
}

// ─── Listar pedidos da loja (rota /minhas) ────────────────────────────────────

export async function getStoreFernandoOrders(req, res, next) {
  try {
    const ownerId = req.user.id || req.user._id || req.user.username
    const filter = { ...req.query, ownerId }
    const items = await getAllFernandoOrders(filter)
    res.json(items)
  } catch (err) { next(err) }
}

// ─── Buscar pedido por ID ─────────────────────────────────────────────────────

export async function getFernandoOrder(req, res, next) {
  try {
    const order = await getFernandoOrderById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' })

    const ownerId = req.user.id || req.user._id || req.user.username
    const isOwner = order.ownerId === ownerId || order.solicitanteId === ownerId

    if (!isFernandoOrAdmin(req.user) && !isOwner) {
      return res.status(403).json({ message: 'Acesso não autorizado' })
    }

    res.json(order)
  } catch (err) { next(err) }
}

// ─── Criar pedido ─────────────────────────────────────────────────────────────

export async function createNewFernandoOrder(req, res, next) {
  try {
    const { itens, observacoes } = req.body

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ message: 'O pedido deve conter pelo menos um item' })
    }

    // Validar cada item
    for (const item of itens) {
      if (!item.produto || typeof item.produto !== 'string') {
        return res.status(400).json({ message: 'Cada item deve ter um produto válido' })
      }
      if (!item.quantidade || Number(item.quantidade) < 1) {
        return res.status(400).json({ message: `Quantidade inválida para ${item.produto}` })
      }
    }

    const userId = req.user.id || req.user._id || req.user.username
    const payload = {
      numero: generateOrderNumber(),
      loja: req.user.loja || req.user.username || 'Loja',
      solicitante: req.user.name || req.user.username || 'Usuário',
      solicitanteId: userId,
      ownerId: userId,
      itens: itens.map(item => ({
        produto: item.produto.trim(),
        quantidade: Number(item.quantidade),
        tamanho: item.tamanho?.trim() || '',
        degraus: item.degraus?.trim() || '',
        cor: item.cor?.trim() || '',
        modelo: item.modelo?.trim() || '',
        descricaoOutros: item.descricaoOutros?.trim() || ''
      })),
      observacoes: (observacoes || '').trim()
    }

    const doc = await createFernandoOrder(payload)
    res.status(201).json(doc)
  } catch (err) { next(err) }
}

// ─── Atualizar status (Fernando/Admin) ────────────────────────────────────────

export async function changeFernandoOrderStatus(req, res, next) {
  try {
    if (!isFernandoOrAdmin(req.user)) {
      return res.status(403).json({ message: 'Acesso restrito ao Fernando' })
    }

    const { status, observacaoFernando } = req.body
    if (!status) return res.status(400).json({ message: 'Campo status obrigatório' })
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` })
    }

    const updated = await updateFernandoOrderStatus(req.params.id, status, observacaoFernando || '')
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' })
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Registrar autorizador (Fernando/Admin) ───────────────────────────────────

export async function registerAutorizadoPor(req, res, next) {
  try {
    if (!isFernandoOrAdmin(req.user)) {
      return res.status(403).json({ message: 'Acesso restrito ao Fernando' })
    }

    const { autorizadoPor, observacaoFernando } = req.body
    if (!VALID_AUTORIZADORES.includes(autorizadoPor)) {
      return res.status(400).json({
        message: `autorizadoPor inválido. Use: ${VALID_AUTORIZADORES.filter(Boolean).join(', ')}`
      })
    }

    const updated = await setAutorizadoPor(req.params.id, autorizadoPor, observacaoFernando)
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' })
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Patch genérico (Fernando/Admin) ─────────────────────────────────────────

export async function patchFernandoOrder(req, res, next) {
  try {
    if (!isFernandoOrAdmin(req.user)) {
      return res.status(403).json({ message: 'Acesso restrito ao Fernando' })
    }

    // Campos que o Fernando pode alterar via patch genérico
    const allowed = ['observacaoFernando']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const updated = await updateFernandoOrder(req.params.id, updates)
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' })
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Deletar pedido ───────────────────────────────────────────────────────────

export async function deleteFernandoOrderCtrl(req, res, next) {
  try {
    const order = await getFernandoOrderById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' })

    const userId = req.user.id || req.user._id || req.user.username
    const isOwner = order.ownerId === userId
    if (!isFernandoOrAdmin(req.user) && !isOwner) {
      return res.status(403).json({ message: 'Não autorizado' })
    }

    await deleteFernandoOrder(req.params.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getFernandoDashboardStats(req, res, next) {
  try {
    if (!isFernandoOrAdmin(req.user)) {
      return res.status(403).json({ message: 'Acesso restrito' })
    }
    const { startDate, endDate } = req.query
    const stats = await getFernandoOrderStats({ startDate, endDate })
    const recentPending = await getRecentPendingOrders(10)
    res.json({ stats, recentPending })
  } catch (err) { next(err) }
}