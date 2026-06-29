import OrderModel from '../models/Order.js'
import { readFileSync } from 'fs'
import { join } from 'path'

// fallback JSON data (useful when DB not reachable)
const ordersPath = join(__dirname, '../data/orders.json')
let ordersData = []
try { ordersData = JSON.parse(readFileSync(ordersPath, 'utf8')) } catch (e) { ordersData = [] }

// In‑memory copy used when DB is unavailable
const orders = Array.isArray(ordersData) ? [...ordersData] : []

export async function getAllOrders(filters = {}) {
  try {
    if (OrderModel && OrderModel.find) {
      const q = {}
      if (filters.status) q.status = filters.status
      if (filters.loja) q.loja = { $regex: filters.loja, $options: 'i' }
      if (filters.startDate || filters.endDate) {
        q.createdAt = {}
        if (filters.startDate) {
          const sd = new Date(filters.startDate)
          if (!isNaN(sd)) q.createdAt.$gte = sd
        }
        if (filters.endDate) {
          const ed = new Date(filters.endDate)
          if (!isNaN(ed)) q.createdAt.$lte = ed
        }
        if (Object.keys(q.createdAt).length === 0) delete q.createdAt
      }
      const items = await OrderModel.find(q).lean()
      if (filters.q) {
        return items.filter(i => i.numero?.includes(filters.q) || (i.loja && i.loja.toLowerCase().includes(filters.q.toLowerCase())))
      }
      return items
    }
  } catch (e) {}

  // fallback to in‑memory array
  let items = [...orders]
  if (filters.status) items = items.filter(i => i.status === filters.status)
  if (filters.loja) items = items.filter(i => i.loja.toLowerCase().includes(filters.loja.toLowerCase()))
  if (filters.startDate || filters.endDate) {
    const sd = filters.startDate ? new Date(filters.startDate) : null
    const ed = filters.endDate ? new Date(filters.endDate) : null
    items = items.filter(it => {
      const d = new Date(it.createdAt || it.data)
      if (isNaN(d)) return false
      if (sd && d < sd) return false
      if (ed && d > ed) return false
      return true
    })
  }
  if (filters.q) items = items.filter(i => i.numero?.includes(filters.q) || (i.loja && i.loja.toLowerCase().includes(filters.q.toLowerCase())))
  return items
}

export async function getOrderById(id) {
  try {
    if (OrderModel && OrderModel.findById) return await OrderModel.findById(id).lean()
  } catch (e) {}
  return orders.find(o => String(o.id) === String(id))
}

export async function createOrder(payload) {
  try {
    if (OrderModel && OrderModel.create) {
      const doc = await OrderModel.create(payload)
      return doc.toObject()
    }
  } catch (e) {}
  const id = Date.now()
  const now = new Date().toISOString().slice(0, 10)
  const order = { id, data: payload.data || now, status: payload.status || 'Pendente', ...payload }
  orders.unshift(order)
  return order
}

export async function updateOrder(id, updates) {
  try {
    if (OrderModel && OrderModel.findByIdAndUpdate) return await OrderModel.findByIdAndUpdate(id, updates, { new: true }).lean()
  } catch (e) {}
  const idx = orders.findIndex(o => String(o.id) === String(id))
  if (idx === -1) return null
  orders[idx] = { ...orders[idx], ...updates }
  return orders[idx]
}

export async function updateOrderStatus(id, status) {
  return updateOrder(id, { status })
}

export async function deleteOrder(id) {
  try {
    if (OrderModel && OrderModel.findByIdAndDelete) await OrderModel.findByIdAndDelete(id)
    else {
      const idx = orders.findIndex(o => String(o.id) === String(id))
      if (idx !== -1) orders.splice(idx, 1)
    }
    return true
  } catch (e) { return false }
}

export default { getAllOrders, getOrderById, createOrder, updateOrder, updateOrderStatus, deleteOrder }
