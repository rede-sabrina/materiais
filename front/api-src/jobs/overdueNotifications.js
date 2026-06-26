import ReturnModel from '../models/Return.js'
import { notifyAdmins } from '../utils/mailer.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export async function checkAndNotify(){
  try{
    const tenDaysAgo = new Date(Date.now() - (10 * MS_PER_DAY))
    // statuses considered finished
    const finished = ['Concluído','Concluido','Cancelado','Cancelada']
    const overdue = await ReturnModel.find({
      createdAt: { $lte: tenDaysAgo },
      status: { $nin: finished },
      overdueNotified: { $ne: true }
    }).lean()
    if(!overdue || overdue.length === 0) return

    // group by loja
    const byLoja = overdue.reduce((acc, r) => {
      const key = r.loja || '—'
      if(!acc[key]) acc[key] = []
      acc[key].push(r)
      return acc
    }, {})

    // send one email per loja with all returns listed
    for(const [loja, list] of Object.entries(byLoja)){
      try{
        const subject = `[Atenção] Devoluções em atraso — Loja: ${loja} (${list.length})`
        const returnsHtml = list.map(r=>{
          return `<li><strong>Nota:</strong> ${r.nota || r._id} — <strong>Distribuidora:</strong> ${r.distribuidora || '—'} — <strong>Data:</strong> ${r.createdAt} — <strong>Status:</strong> ${r.status}</li>`
        }).join('')

        const html = `<p>Foram encontradas ${list.length} devoluções em atraso para a loja <strong>${loja}</strong>:</p><ul>${returnsHtml}</ul><p>Acesse o sistema para verificar cada caso.</p>`

        const returnsText = list.map(r=>{
          return `Nota: ${r.nota || r._id} — Distribuidora: ${r.distribuidora || '—'} — Data: ${r.createdAt} — Status: ${r.status}`
        }).join('\n')

        const text = `Foram encontradas ${list.length} devoluções em atraso para a loja ${loja}:\n\n${returnsText}`

        await notifyAdmins(subject, html, text)

        // mark all as notified
        const ids = list.map(r=> r._id)
        try{ await ReturnModel.updateMany({ _id: { $in: ids } }, { overdueNotified: true }) } catch(e){}
      } catch(e){ console.error('overdueNotifications per-loja failed', e) }
    }
  } catch(e){ console.error('overdueNotifications failed', e) }
}

export function startOverdueJob(){
  // run immediately, then every 24h
  checkAndNotify().catch(()=>{})
  const handle = setInterval(()=>{ checkAndNotify().catch(()=>{}) }, 24 * 60 * 60 * 1000)
  return () => clearInterval(handle)
}
