import { getAllReturns } from '../services/returns.service.js'

export async function summaryReports(req, res, next){
  try{
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      loja: req.query.loja
    }
    const itemsRaw = await getAllReturns(filters)
    // allow filtering by distribuidora (service doesn't support it directly)
    let items = itemsRaw
    if(req.query.distribuidora){
      const q = String(req.query.distribuidora).toLowerCase()
      items = items.filter(it => (it.distribuidora || '').toLowerCase().includes(q))
    }
    // aggregate by loja
    const byLojaMap = {}
    const byDistMap = {}
    let totalValue = 0
    let totalCount = 0
    items.forEach(it=>{
      const v = Number(it.nfdValue) || 0
      const loja = it.loja || '—'
      const dist = it.distribuidora || '—'
      totalValue += v
      totalCount += 1
      byLojaMap[loja] = byLojaMap[loja] || { loja, totalValue:0, count:0 }
      byLojaMap[loja].totalValue += v
      byLojaMap[loja].count += 1
      byDistMap[dist] = byDistMap[dist] || { distribuidora: dist, totalValue:0, count:0 }
      byDistMap[dist].totalValue += v
      byDistMap[dist].count += 1
    })
    const byLoja = Object.values(byLojaMap).sort((a,b)=> b.totalValue - a.totalValue)
    const byDistribuidora = Object.values(byDistMap).sort((a,b)=> b.totalValue - a.totalValue)
    res.json({ total: { totalValue, totalCount }, byLoja, byDistribuidora })
  } catch(err){ next(err) }
}
