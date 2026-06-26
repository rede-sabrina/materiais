import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  codigo: String,
  ean: String,
  nome: String,
  quantidade: Number
})

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
