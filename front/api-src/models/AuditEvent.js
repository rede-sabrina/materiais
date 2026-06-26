import mongoose from 'mongoose'

const AuditEventSchema = new mongoose.Schema({
  returnId: String,
  nota: String,
  loja: String,
  action: String,
  changes: Object,
  actor: {
    id: String,
    username: String,
    loja: String,
    role: String
  },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.AuditEvent || mongoose.model('AuditEvent', AuditEventSchema)
