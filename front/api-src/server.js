import dotenv from 'dotenv'
import app from './app.js'
import connectDB from './config/db.js'

dotenv.config()

const port = process.env.PORT || 3000

async function start(){
    try{
        await connectDB()
        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`)
        })
    } catch(err){
        console.error('Failed to start server:', err.message)
        process.exit(1)
    }
}

start()

