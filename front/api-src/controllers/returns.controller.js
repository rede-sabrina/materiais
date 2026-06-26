import { getAllReturns, getReturnById } from '../services/returns.service.js'
import { createAuditEvent } from '../services/audit.service.js'

function buildActor(user){
  if(!user) return null
  return {
    id: user.id || user._id || user.username || null,
    username: user.username || null,
    loja: user.loja || null,
    role: user.role || null
  }
}

export async function listReturns(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      loja: req.query.loja,
      q: req.query.q,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }
    let items = await getAllReturns(filters)
    // if not admin, filter by user's loja or username
    const user = req.user
    if(user && user.role !== 'ADMIN'){
      items = items.filter(i => (user.loja && i.loja === user.loja) || i.loja === user.username)
    }
    res.json(items)
  } catch (err) {
    next(err)
  }
}

export async function getReturn(req, res, next) {
  try {
    const item = await getReturnById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Devolução não encontrada' })
    // ownership check for non-admin
    const user = req.user
    if(user && user.role !== 'ADMIN'){
      if(!(user.loja && item.loja === user.loja) && item.loja !== user.username){
        return res.status(403).json({ message: 'Acesso negado' })
      }
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export async function createReturn(req, res, next) {
  try {
    const payload = req.body
    // if user is loja, enforce loja field
    if(req.user && req.user.role !== 'ADMIN'){
      payload.loja = req.user.loja || req.user.username
    }
    // normalize nfdDate to YYYY-MM-DD (no timezone)
    if(payload.nfdDate){
      try{
        const d = new Date(payload.nfdDate)
        if(!isNaN(d)){
          const y = d.getUTCFullYear()
          const m = String(d.getUTCMonth()+1).padStart(2,'0')
          const day = String(d.getUTCDate()).padStart(2,'0')
          payload.nfdDate = `${y}-${m}-${day}`
        } else {
          delete payload.nfdDate
        }
      } catch(e){ delete payload.nfdDate }
    }
    // sanitize nfdValue (convert to Number) and nfdQuantity (int)
    if('nfdValue' in payload){
      const v = parseFloat(String(payload.nfdValue).replace(',', '.'))
      if(!isNaN(v)) payload.nfdValue = v
      else delete payload.nfdValue
    }
    if('nfdQuantity' in payload){
      const q = parseInt(payload.nfdQuantity)
      if(!isNaN(q)) payload.nfdQuantity = q
      else delete payload.nfdQuantity
    }
    const item = await (await import('../services/returns.service.js')).createReturn(payload)
    await createAuditEvent({
      returnId: String(item._id || item.id || ''),
      nota: item.nota || null,
      loja: item.loja || null,
      action: 'RETURN_CREATED',
      changes: null,
      actor: buildActor(req.user)
    })
    res.status(201).json(item)
  } catch (err) { next(err) }
}

export async function updateReturnController(req, res, next) {
  try {
    const id = req.params.id
    const updates = req.body
    // prevent loja from modifying protocolo
    const user = req.user
    if(user && user.role !== 'ADMIN'){
      if('protocolo' in updates) return res.status(403).json({ message: 'Não autorizado a alterar protocolo' })
      if('notaAnexada' in updates) return res.status(403).json({ message: 'Não autorizado a alterar nota anexada' })
    }

    // normalize nfdDate if present in updates
    if('nfdDate' in updates){
      try{
        const d = new Date(updates.nfdDate)
        if(!isNaN(d)){
          const y = d.getUTCFullYear()
          const m = String(d.getUTCMonth()+1).padStart(2,'0')
          const day = String(d.getUTCDate()).padStart(2,'0')
          updates.nfdDate = `${y}-${m}-${day}`
        } else {
          delete updates.nfdDate
        }
      } catch(e){ delete updates.nfdDate }
    }
    // sanitize numeric fields in updates
    if('nfdValue' in updates){
      const v = parseFloat(String(updates.nfdValue).replace(',', '.'))
      if(!isNaN(v)) updates.nfdValue = v
      else delete updates.nfdValue
    }
    if('nfdQuantity' in updates){
      const q = parseInt(updates.nfdQuantity)
      if(!isNaN(q)) updates.nfdQuantity = q
      else delete updates.nfdQuantity
    }

    // ownership check for non-admin
    const existing = await (await import('../services/returns.service.js')).getReturnById(id)
    if(!existing) return res.status(404).json({ message: 'Devolução não encontrada' })
    if(user && user.role !== 'ADMIN'){
      if(!(user.loja && existing.loja === user.loja) && existing.loja !== user.username){
        return res.status(403).json({ message: 'Acesso negado' })
      }
    }

    const nfdFields = ['nfdNumber','nfdDate','nfdValue','nfdQuantity']
    const nfdChanges = {}
    nfdFields.forEach(field=>{
      if(field in updates){
        const before = existing[field]
        const after = updates[field]
        if(String(before ?? '') !== String(after ?? '')){
          nfdChanges[field] = { from: before ?? null, to: after ?? null }
        }
      }
    })

    const item = await (await import('../services/returns.service.js')).updateReturn(id, updates)
    if(Object.keys(nfdChanges).length > 0){
      await createAuditEvent({
        returnId: String(existing._id || existing.id || id),
        nota: existing.nota || null,
        loja: existing.loja || null,
        action: 'NFD_UPDATED',
        changes: nfdChanges,
        actor: buildActor(user)
      })
    }
    res.json(item)
  } catch (err) { next(err) }
}

export async function updateStatusController(req, res, next) {
  try{
    const id = req.params.id
    const { status } = req.body
    const user = req.user
    // non-admin allowed statuses: Pendente, Solicitado, Coletado
    if(user && user.role !== 'ADMIN'){
      const allowed = ['Pendente','Solicitado','Coletado']
      if(!allowed.includes(status)) return res.status(403).json({ message: 'Não autorizado a alterar para esse status' })
    }

    const existing = await (await import('../services/returns.service.js')).getReturnById(id)
    if(!existing) return res.status(404).json({ message: 'Devolução não encontrada' })
    if(user && user.role !== 'ADMIN'){
      if(!(user.loja && existing.loja === user.loja) && existing.loja !== user.username){
        return res.status(403).json({ message: 'Acesso negado' })
      }
    }

    const item = await (await import('../services/returns.service.js')).updateReturnStatus(id, status)
    if(existing.status !== status){
      await createAuditEvent({
        returnId: String(existing._id || existing.id || id),
        nota: existing.nota || null,
        loja: existing.loja || null,
        action: 'STATUS_CHANGED',
        changes: { status: { from: existing.status || null, to: status || null } },
        actor: buildActor(user)
      })
    }
    res.json(item)
  } catch(err){ next(err) }
}

export async function deleteReturnController(req, res, next) {
  try{
    const id = req.params.id
    const user = req.user
    const existing = await (await import('../services/returns.service.js')).getReturnById(id)
    if(!existing) return res.status(404).json({ message: 'Devolução não encontrada' })
    if(user && user.role !== 'ADMIN'){
      if(!(user.loja && existing.loja === user.loja) && existing.loja !== user.username){
        return res.status(403).json({ message: 'Acesso negado' })
      }
    }

    const ok = await (await import('../services/returns.service.js')).deleteReturn(id)
    if(!ok) return res.status(500).json({ message: 'Erro ao deletar' })
    await createAuditEvent({
      returnId: String(existing._id || existing.id || id),
      nota: existing.nota || null,
      loja: existing.loja || null,
      action: 'RETURN_DELETED',
      changes: null,
      actor: buildActor(user)
    })
    res.json({ ok: true })
  } catch(err){ next(err) }
}
