const cache = global.__mongoCache || (global.__mongoCache = { connected: false, promise: null })

async function ensureDb(connectDB){
  if(cache.connected) return
  if(!cache.promise){
    cache.promise = connectDB()
      .then(()=>{ cache.connected = true })
      .catch(err=>{ cache.promise = null; throw err })
  }
  await cache.promise
}

module.exports = async function handler(req, res){
  const origin = req.headers && req.headers.origin
  if(origin){
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  if(req.method === 'OPTIONS'){
    res.statusCode = 204
    res.end()
    return
  }

  const url = req.url || req.headers['x-original-url'] || req.headers['x-forwarded-uri'] || ''
  const isHealth = /\/(health|ping)(\b|\/|$)/.test(url)
  if(isHealth){
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
    return
  }

  const debug = String(process.env.DEBUG_ERRORS || '').toLowerCase() === 'true'

  let appMod, dbMod
  try{
    const appModule = global.__appModulePromise || (global.__appModulePromise = import('../api-src/app.js'))
    const dbModule  = global.__dbModulePromise  || (global.__dbModulePromise  = import('../api-src/config/db.js'))
    ;[appMod, dbMod] = await Promise.all([appModule, dbModule])
  } catch(importErr){
    // reset cached promises so next cold start retries
    global.__appModulePromise = null
    global.__dbModulePromise  = null
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      ok: false,
      error: 'module_import_failed',
      ...(debug ? { message: importErr.message, stack: importErr.stack } : {})
    }))
    return
  }

  const unwrapDefault = (mod) => {
    let cur = mod
    for(let i = 0; i < 2; i++){
      if(cur && cur.default) cur = cur.default
    }
    return cur
  }
  const app = unwrapDefault(appMod) || appMod.app || appMod
  const dbCandidate = unwrapDefault(dbMod)
  const connectDB =
    (typeof dbCandidate === 'function' && dbCandidate) ||
    (dbCandidate && typeof dbCandidate.connectDB === 'function' && dbCandidate.connectDB) ||
    (dbMod && typeof dbMod.connectDB === 'function' && dbMod.connectDB) ||
    null
  try{
    if(typeof connectDB !== 'function'){
      const err = new TypeError('connectDB is not a function')
      err.code = 'CONNECT_DB_NOT_FUNCTION'
      throw err
    }
    await ensureDb(connectDB)
  } catch(err){
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    const details = debug ? {
      message: err.message,
      name: err.name,
      code: err.code,
      dbModuleKeys: dbMod ? Object.keys(dbMod) : [],
      dbModuleDefaultKeys: dbMod && dbMod.default ? Object.keys(dbMod.default) : []
    } : {}
    res.end(JSON.stringify({ ok: false, error: 'db_connect_failed', ...details }))
    return
  }
  return app(req, res)
}
