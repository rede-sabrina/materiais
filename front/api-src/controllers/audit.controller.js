import { listAuditEvents, deleteAuditEvents } from '../services/audit.service.js'

export async function listAudit(req, res, next){
  try{
    const limit = req.query.limit ? Number(req.query.limit) : 200
    const { returnId, startDate, endDate, action, nota, loja, actor } = req.query
    const items = await listAuditEvents({ limit, returnId, startDate, endDate, action, nota, loja, actor })
    res.json(items)
  } catch(err){ next(err) }
}

export async function deleteAudit(req, res, next){
  try{
    const { returnId, startDate, endDate, action, nota, loja, actor } = req.query
    const deleted = await deleteAuditEvents({ returnId, startDate, endDate, action, nota, loja, actor })
    res.json({ deleted })
  } catch(err){ next(err) }
}
