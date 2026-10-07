import mongoose from 'mongoose'

// Sub-documento para cada item do pedido
const ItemPedidoSchema = new mongoose.Schema({
  produto: { type: String, required: true },
  quantidade: { type: Number, required: true, min: 1 },
  // Campos condicionais — presentes somente quando aplicável ao produto
  tamanho: { type: String, default: '' },           // TAPETE
  degraus: { type: String, default: '' },           // ESCADA
  cor: { type: String, default: '' },               // TINTA PARA IMPRESSORA
  modelo: { type: String, default: '' },            // TINTA PARA IMPRESSORA
  descricaoOutros: { type: String, default: '' }    // OUTROS
}, { _id: false })

const FernandoOrderSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  loja: { type: String, required: true },
  solicitante: { type: String, required: true },
  solicitanteId: { type: String, required: true },
  ownerId: { type: String, required: true },

  // Lista de itens do pedido (novo formato multi-item)
  itens: { type: [ItemPedidoSchema], default: [] },

  observacoes: { type: String, default: '' },

  status: {
    type: String,
    enum: ['Pendente', 'Em andamento', 'Atendido', 'Cancelado'],
    default: 'Pendente'
  },

  // Preenchido pelo Fernando após análise do pedido
  autorizadoPor: {
    type: String,
    enum: ['Lucas', 'Adriana', 'Marcelo', 'Supervisor', ''],
    default: ''
  },
  autorizadoEm: { type: Date, default: null },

  // Observação do Fernando ao atualizar o pedido
  observacaoFernando: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null }
})

FernandoOrderSchema.index({ loja: 1, createdAt: -1 })
FernandoOrderSchema.index({ status: 1 })
FernandoOrderSchema.index({ ownerId: 1 })
FernandoOrderSchema.index({ solicitanteId: 1 })

export default mongoose.models.FernandoOrder || mongoose.model('FernandoOrder', FernandoOrderSchema)