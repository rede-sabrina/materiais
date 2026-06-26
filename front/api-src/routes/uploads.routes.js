import { Router } from 'express'
import multer from 'multer'
import { handleUpload } from '../controllers/uploads.controller.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', upload.single('file'), handleUpload)

export default router
