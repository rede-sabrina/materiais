import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN','LOJA'], default: 'LOJA' },
  loja: { type: String },
  razaoSocial: { type: String },
  cnpj: { type: String },
  endereco: { type: String },
  cep: { type: String },
  numeroLoja: { type: String },
  cidade: { type: String },
  estado: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
