import AuditEventModel from '../models/AuditEvent.js'

const auditEvents = []

export async function createAuditEvent(payload){
  try{
    if(AuditEventModel && AuditEventModel.create){
      const doc = await AuditEventModel.create(payload)
      return doc.toObject ? doc.toObject() : doc
    }
  } catch(e){}
  const item = { ...payload, id: Date.now(), createdAt: new Date().toISOString() }
  auditEvents.unshift(item)
  return item
}

function buildQuery({ returnId, startDate, endDate, action, nota, loja, actor } = {}){
  const q = {}
  if(returnId) q.returnId = String(returnId)
  if(action) q.action = String(action)
  if(nota) q.nota = { $regex: String(nota), $options: 'i' }
  if(loja) q.loja = { $regex: String(loja), $options: 'i' }
  if(actor){
    const v = String(actor)
    q.$or = [
      { 'actor.username': { $regex: v, $options: 'i' } },
      { 'actor.loja': { $regex: v, $options: 'i' } }
    ]
  }
  if(startDate || endDate){
    q.createdAt = {}
    if(startDate){
      const sd = new Date(startDate)
      if(!isNaN(sd)) q.createdAt.$gte = sd
    }
    if(endDate){
      const ed = new Date(endDate)
      if(!isNaN(ed)) q.createdAt.$lte = ed
    }
    if(Object.keys(q.createdAt).length === 0) delete q.createdAt
  }
  return q
}

export async function listAuditEvents({ limit = 200, returnId, startDate, endDate, action, nota, loja, actor } = {}){
  try{
    if(AuditEventModel && AuditEventModel.find){
      const q = buildQuery({ returnId, startDate, endDate, action, nota, loja, actor })
      const items = await AuditEventModel.find(q).sort({ createdAt: -1 }).limit(Number(limit) || 200).lean()
      return items
    }
  } catch(e){}
  let items = [...auditEvents]
  if(returnId) items = items.filter(i=> String(i.returnId) === String(returnId))
  if(action) items = items.filter(i=> String(i.action) === String(action))
  if(nota) items = items.filter(i=> String(i.nota || '').toLowerCase().includes(String(nota).toLowerCase()))
  if(loja) items = items.filter(i=> String(i.loja || '').toLowerCase().includes(String(loja).toLowerCase()))
  if(actor){
    const v = String(actor).toLowerCase()
    items = items.filter(i=> String(i.actor?.username || '').toLowerCase().includes(v) || String(i.actor?.loja || '').toLowerCase().includes(v))
  }
  if(startDate || endDate){
    const sd = startDate ? new Date(startDate) : null
    const ed = endDate ? new Date(endDate) : null
    items = items.filter(it=>{
      const d = new Date(it.createdAt)
      if(isNaN(d)) return false
      if(sd && d < sd) return false
      if(ed && d > ed) return false
      return true
    })
  }
  return items.slice(0, Number(limit) || 200)
}

export async function deleteAuditEvents({ returnId, startDate, endDate, action, nota, loja, actor } = {}){
  try{
    if(AuditEventModel && AuditEventModel.deleteMany){
      const q = buildQuery({ returnId, startDate, endDate, action, nota, loja, actor })
      const res = await AuditEventModel.deleteMany(q)
      return res?.deletedCount || 0
    }
  } catch(e){}
  const before = auditEvents.length
  const filtered = await listAuditEvents({ limit: before, returnId, startDate, endDate, action, nota, loja, actor })
  const ids = new Set(filtered.map(i=> i.id))
  const remaining = auditEvents.filter(i=> !ids.has(i.id))
  auditEvents.length = 0
  auditEvents.push(...remaining)
  return before - remaining.length
}
