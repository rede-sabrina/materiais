import ReturnModel from '../models/Return.js'
import { readFileSync } from 'fs'
import { join } from 'path'

const returnsPath = join(__dirname, '../data/returns.json')
let returnsData = []
try { returnsData = JSON.parse(readFileSync(returnsPath, 'utf8')) } catch(e){ returnsData = [] }

// use in-memory array initialized from JSON as fallback
const returns = Array.isArray(returnsData) ? [...returnsData] : []

export async function getAllReturns(filters = {}){
  try{
    if(ReturnModel && ReturnModel.find){
      const q = {}
      if(filters.status) q.status = filters.status
      if(filters.loja) q.loja = { $regex: filters.loja, $options: 'i' }
      // date range filter on createdAt
      if(filters.startDate || filters.endDate){
        q.createdAt = {}
        if(filters.startDate){
          const sd = new Date(filters.startDate)
          if(!isNaN(sd)) q.createdAt.$gte = sd
        }
        if(filters.endDate){
          const ed = new Date(filters.endDate)
          if(!isNaN(ed)) q.createdAt.$lte = ed
        }
        // if createdAt ended up empty, delete
        if(Object.keys(q.createdAt).length === 0) delete q.createdAt
      }
      const items = await ReturnModel.find(q).lean()
      if(filters.q){
        return items.filter(i => (i.nota && i.nota.toString().includes(filters.q)) || (i.loja && i.loja.toLowerCase().includes(filters.q.toLowerCase())))
      }
      return items
    }
  } catch(e){}

  let items = [...returns]
  // apply date range filters in fallback
  if(filters.startDate || filters.endDate){
    const sd = filters.startDate ? new Date(filters.startDate) : null
    const ed = filters.endDate ? new Date(filters.endDate) : null
    items = items.filter(it=>{
      const v = it.createdAt || it.data
      if(!v) return false
      const d = new Date(v)
      if(isNaN(d)) return false
      if(sd && d < sd) return false
      if(ed && d > ed) return false
      return true
    })
  }
  if(filters.status) items = items.filter(i => i.status === filters.status)
  if(filters.loja) items = items.filter(i => i.loja.toLowerCase().includes(filters.loja.toLowerCase()))
  if(filters.q) items = items.filter(i => i.nota.includes(filters.q) || (i.loja && i.loja.toLowerCase().includes(filters.q.toLowerCase())))
  return items
}

export async function getReturnById(id){
  try{
    if(ReturnModel && ReturnModel.findById) return await ReturnModel.findById(id).lean()
  } catch(e){}
  return returns.find(r => String(r.id) === String(id))
}

export async function createReturn(payload){
  try{
    if(ReturnModel && ReturnModel.create){
      const doc = await ReturnModel.create(payload)
      return doc.toObject()
    }
  } catch(e){}
  const id = Date.now()
  const now = new Date().toISOString().slice(0,10)
  const item = { id, data: payload.data || now, status: payload.status || 'Pendente', ...payload }
  returns.unshift(item)
  return item
}

export async function updateReturn(id, updates){
  try{
    if(ReturnModel && ReturnModel.findByIdAndUpdate) return await ReturnModel.findByIdAndUpdate(id, updates, { new: true }).lean()
  } catch(e){}
  const idx = returns.findIndex(r => String(r.id) === String(id))
  if(idx === -1) return null
  returns[idx] = { ...returns[idx], ...updates }
  return returns[idx]
}

export async function updateReturnStatus(id, status){
  return updateReturn(id, { status })
}

export async function deleteReturn(id){
  try{
    if(ReturnModel && ReturnModel.findByIdAndDelete) await ReturnModel.findByIdAndDelete(id)
    else {
      const idx = returns.findIndex(r => String(r.id) === String(id))
      if(idx === -1) return false
      returns.splice(idx,1)
    }
    return true
  } catch(e){ return false }
}
