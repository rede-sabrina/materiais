import { Router } from 'express'
import { uploadFernandoAttachment, handleFernandoAttachmentUpload, serveFernandoAttachment } from '../controllers/fernandoUploads.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.post('/anexo', uploadFernandoAttachment, handleFernandoAttachmentUpload)
router.get('/anexo/:filename', serveFernandoAttachment)

export default router