import mongoose from 'mongoose'

export default async function connectDB(){
  const uri = process.env.MONGO_URI
  if(!uri){
    console.log('MONGO_URI not set — skipping MongoDB connection')
    return
  }
  let finalUri = uri
  const dbName = process.env.MONGO_DB
  try{
    if(dbName){
      // find "?" that starts query params
      const qmIndex = uri.indexOf('?')
      if(qmIndex !== -1){
        // check if there's already a path between host and ? (eg '/dbname')
        const pathStart = uri.indexOf('/', uri.indexOf('://') + 3)
        const path = uri.slice(pathStart, qmIndex)
        if(!path || path === '/'){
          // avoid producing '//' before db name if uri already ends with '/'
          const prefix = uri.slice(0, qmIndex)
          const trimmedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
          finalUri = trimmedPrefix + '/' + encodeURIComponent(dbName) + uri.slice(qmIndex)
        }
      } else {
        // no query params
        const path = uri.slice(uri.indexOf('/', uri.indexOf('://') + 3))
        if(!path || path === '/') finalUri = uri.replace(/\/?$/, '') + '/' + encodeURIComponent(dbName)
      }
    }

    await mongoose.connect(finalUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    })
    console.log('Connected to MongoDB')
  } catch(err){
    console.error('MongoDB connection error:', err.message)
    throw err
  }
}
