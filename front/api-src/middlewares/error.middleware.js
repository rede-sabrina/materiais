export function notFound(req, res, next){
  res.status(404).json({ message: 'Not Found' })
}

export function errorHandler(err, req, res, next){
  console.error(err)
  const debug = String(process.env.DEBUG_ERRORS || '').toLowerCase() === 'true'
  const payload = { message: err.message || 'Internal Server Error' }
  if(debug){
    payload.name = err.name
    payload.code = err.code
    payload.stack = err.stack
  }
  res.status(500).json(payload)
}
