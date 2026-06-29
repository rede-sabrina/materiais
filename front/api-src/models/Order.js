import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema(
  {
    ean: String,
    nome: String,
    codigo: String,
    quantidade: Number,
  },
  { _id: false }
)

const OrderSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  loja: { type: String, required: true },
  data: { type: String, default: () => new Date().toISOString().split('T')[0] }, // YYYY-MM-DD
  itens: [OrderItemSchema],
  status: {
    type: String,
    enum: ['Pendente', 'Impresso', 'Concluído'],
    default: 'Pendente',
  },
  observacaoAdmin: { type: String, default: '' },
  ownerId: { type: String, required: true }, // <-- quem criou o pedido
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
})

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)
