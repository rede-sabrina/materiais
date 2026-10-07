import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadDir = join(__dirname, '../uploads/fernando-orders')

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = file.originalname.split('.').pop()
    cb(null, `fer-${uniqueSuffix}.${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de arquivo não permitido. Permitidos: imagens, PDF, Word, Excel'), false)
  }
}

export const uploadFernandoAttachment = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('anexo')

export async function handleFernandoAttachmentUpload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Arquivo obrigatório' })
    
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedAt: new Date().toISOString()
    }
    
    res.json({ success: true, file: fileInfo })
  } catch (err) {
    next(err)
  }
}

export async function serveFernandoAttachment(req, res, next) {
  try {
    const { filename } = req.params
    const filePath = join(uploadDir, filename)
    
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo não encontrado' })
    }
    
    res.sendFile(filePath)
  } catch (err) {
    next(err)
  }
}