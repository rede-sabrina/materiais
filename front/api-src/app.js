import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import router from './routes/index.js'
import { notFound, errorHandler } from './middlewares/error.middleware.js'
import { startOverdueJob } from './jobs/overdueNotifications.js'

const app = express();

// midlwares globais
// allow frontend origin(s) via env `FRONTEND_URL` (comma-separated) or default to localhost during dev
const frontendEnv = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || 'http://localhost:5173'
const allowedOrigins = Array.isArray(frontendEnv) ? frontendEnv : String(frontendEnv).split(',').map(s => s.trim()).filter(Boolean)
const allowAll = allowedOrigins.includes('*')
app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true)
        if(allowAll) return callback(null, true)
        if(allowedOrigins.includes(origin)) return callback(null, true)
        if(origin.includes('localhost')) return callback(null, true)
        if(origin.endsWith('.vercel.app')) return callback(null, true)
        return callback(new Error('CORS not allowed'))
    },
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use('/api', router)

// health endpoint
app.get('/health', (req, res) => res.status(200).json({ ok: true }))

// lightweight ping endpoint (useful for keep-alive pings)
app.get('/ping', (req, res) => res.status(200).send('pong'))

// Not found + error handler (registered last so other routes run first)
app.use(notFound)
app.use(errorHandler)

// start background jobs (non-blocking) only when enabled via env
try{
    const enabled = String(process.env.ENABLE_OVERDUE_JOB || '').toLowerCase() === 'true'
    if(enabled){
        startOverdueJob()
        console.log('Overdue job enabled')
    } else {
        console.log('Overdue job disabled by ENABLE_OVERDUE_JOB')
    }
}catch(e){ console.error('failed to start overdue job', e) }

export default app