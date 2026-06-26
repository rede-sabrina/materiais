import mongoose from 'mongoose'

const ItemSchema = new mongoose.Schema({
  ean: String,
  nome: String,
  codigo: String,
  quantidade: Number,
  motivo: String
}, { _id: false })

const SobraSchema = new mongoose.Schema({
  ean: String,
  nome: String,
  codigo: String,
  quantidade: Number
}, { _id: false })

const ReturnSchema = new mongoose.Schema({
  nota: String,
  loja: String,
  data: String,
  distribuidora: String,
  destinatarioRazaoSocial: String,
  destinatarioCnpj: String,
  destinatarioEndereco: String,
  destinatarioCidade: String,
  destinatarioEstado: String,
  destinatarioCep: String,
  nfdNumber: String,
  // store as plain YYYY-MM-DD string to avoid timezone issues
  nfdDate: String,
  // total monetary value of the NFD (in local currency units)
  nfdValue: Number,
  // total quantity returned (sum of returned item quantities)
  nfdQuantity: Number,
  // whether the NFD was attached in distributor portals
  notaAnexada: { type: Boolean, default: false },
  // whether an overdue notification was already sent for this return
  overdueNotified: { type: Boolean, default: false },
  items: [ItemSchema],
  sobras: [SobraSchema],
  status: { type: String, default: 'Pendente' },
  protocolo: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
})

export default mongoose.models.Return || mongoose.model('Return', ReturnSchema)
