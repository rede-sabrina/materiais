import { createOrder, getAllOrders, getOrderById, updateOrder, updateOrderStatus, deleteOrder } from '../services/orders.service.js'

// Generate an easy‑to‑read order number, e.g. ORD-20240629-1234
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const rnd = Math.floor(1000 + Math.random()*9000)
  return `ORD-${date}-${rnd}`
}

export async function listOrders(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMIN'
    const filter = { ...req.query }
    if (!isAdmin) filter.ownerId = req.user.id || req.user.username
    const items = await getAllOrders(filter)
    res.json(items)
  } catch (err) { next(err) }
}

export async function getOrder(req, res, next) {
  try {
    const order = await getOrderById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' })
    res.json(order)
  } catch (err) { next(err) }
}

export async function createNewOrder(req, res, next) {
  try {
    const payload = { ...req.body }
    // acrescenta quem está criando o pedido
    payload.ownerId = req.user.id || req.user.username
    if (!payload.numero) payload.numero = generateOrderNumber()
    const doc = await createOrder(payload)
    res.status(201).json(doc)
  } catch (err) { next(err) }
}

export async function patchOrder(req, res, next) {
  try {
    const updated = await updateOrder(req.params.id, req.body)
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' })
    res.json(updated)
  } catch (err) { next(err) }
}

export async function changeStatus(req, res, next) {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ message: 'Campo status requerido' })
    const updated = await updateOrderStatus(req.params.id, status)
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' })
    res.json(updated)
  } catch (err) { next(err) }
}

export async function deleteOrderCtrl(req, res, next) {
  try {
    const order = await getOrderById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' })
    const isAdmin = req.user && req.user.role === 'ADMIN'
    const ownerId = order.ownerId
    const userId = req.user.id || req.user.username
    if (!isAdmin && ownerId !== userId) return res.status(403).json({ message: 'Não autorizado' })
    const ok = await deleteOrder(req.params.id)
    if (!ok) return res.status(500).json({ message: 'Falha ao excluir' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}
