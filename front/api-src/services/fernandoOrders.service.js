import FernandoOrderModel from '../models/FernandoOrder.js'

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rnd = Math.floor(1000 + Math.random() * 9000)
  return `FER-${date}-${rnd}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(filters = {}) {
  const q = {}
  if (filters.status) q.status = filters.status
  if (filters.loja) q.loja = { $regex: filters.loja, $options: 'i' }
  if (filters.ownerId) q.ownerId = filters.ownerId
  if (filters.solicitanteId) q.solicitanteId = filters.solicitanteId
  if (filters.autorizadoPor) q.autorizadoPor = filters.autorizadoPor
  if (filters.startDate || filters.endDate) {
    q.createdAt = {}
    if (filters.startDate) {
      const sd = new Date(filters.startDate)
      if (!isNaN(sd)) q.createdAt.$gte = sd
    }
    if (filters.endDate) {
      const ed = new Date(filters.endDate)
      if (!isNaN(ed)) {
        ed.setHours(23, 59, 59, 999)
        q.createdAt.$lte = ed
      }
    }
    if (Object.keys(q.createdAt).length === 0) delete q.createdAt
  }
  return q
}

function applyTextSearch(items, q) {
  if (!q) return items
  const lower = q.toLowerCase()
  return items.filter(i =>
    i.numero?.toLowerCase().includes(lower) ||
    i.loja?.toLowerCase().includes(lower) ||
    i.solicitante?.toLowerCase().includes(lower) ||
    (i.itens || []).some(item => item.produto?.toLowerCase().includes(lower))
  )
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAllFernandoOrders(filters = {}) {
  const query = buildQuery(filters)
  const items = await FernandoOrderModel.find(query).sort({ createdAt: -1 }).lean()
  return applyTextSearch(items, filters.q)
}

export async function getFernandoOrderById(id) {
  return FernandoOrderModel.findById(id).lean()
}

export async function createFernandoOrder(payload) {
  const doc = await FernandoOrderModel.create({
    ...payload,
    numero: payload.numero || generateOrderNumber(),
    status: 'Pendente',
    autorizadoPor: '',
    autorizadoEm: null
  })
  return doc.toObject()
}

export async function updateFernandoOrder(id, updates) {
  return FernandoOrderModel.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean()
}

export async function updateFernandoOrderStatus(id, status, observacaoFernando = '') {
  const updates = { status, updatedAt: new Date() }
  if (observacaoFernando) updates.observacaoFernando = observacaoFernando
  return FernandoOrderModel.findByIdAndUpdate(id, updates, { new: true }).lean()
}

export async function setAutorizadoPor(id, autorizadoPor, observacaoFernando = '') {
  const updates = {
    autorizadoPor,
    autorizadoEm: new Date(),
    updatedAt: new Date()
  }
  if (observacaoFernando !== undefined) updates.observacaoFernando = observacaoFernando
  return FernandoOrderModel.findByIdAndUpdate(id, updates, { new: true }).lean()
}

export async function deleteFernandoOrder(id) {
  await FernandoOrderModel.findByIdAndDelete(id)
  return true
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getFernandoOrderStats(filters = {}) {
  const match = buildQuery(filters)
  const pipeline = []
  if (Object.keys(match).length > 0) pipeline.push({ $match: match })
  pipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } })

  const stats = await FernandoOrderModel.aggregate(pipeline)
  const result = { total: 0, pendente: 0, emAndamento: 0, atendido: 0, cancelado: 0 }
  stats.forEach(s => {
    result.total += s.count
    if (s._id === 'Pendente') result.pendente = s.count
    else if (s._id === 'Em andamento') result.emAndamento = s.count
    else if (s._id === 'Atendido') result.atendido = s.count
    else if (s._id === 'Cancelado') result.cancelado = s.count
  })
  return result
}

export async function getRecentPendingOrders(limit = 10) {
  return FernandoOrderModel.find({ status: 'Pendente' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

export default {
  getAllFernandoOrders,
  getFernandoOrderById,
  createFernandoOrder,
  updateFernandoOrder,
  updateFernandoOrderStatus,
  setAutorizadoPor,
  deleteFernandoOrder,
  getFernandoOrderStats,
  getRecentPendingOrders
}