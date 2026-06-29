import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  codigo: String,
  ean: String,
  nome: String,
  quantidade: Number,
  active: { type: Boolean, default: true }
})

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
