import { checkAndNotify } from '../jobs/overdueNotifications.js'

function getCronToken(req){
  const headerToken = req.headers['x-cron-token']
  if(headerToken) return String(headerToken)
  if(req.query && req.query.token) return String(req.query.token)
  return ''
}

export async function runOverdueJob(req, res, next){
  try{
    const expected = String(process.env.CRON_TOKEN || '')
    if(!expected) return res.status(500).json({ ok: false, error: 'CRON_TOKEN not configured' })
    const received = getCronToken(req)
    if(received !== expected) return res.status(403).json({ ok: false, error: 'Invalid token' })

    await checkAndNotify()
    return res.json({ ok: true })
  } catch(err){
    return next(err)
  }
}
