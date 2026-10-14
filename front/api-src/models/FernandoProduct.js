import mongoose from 'mongoose'

const FernandoProductSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.models.FernandoProduct ||
  mongoose.model('FernandoProduct', FernandoProductSchema)
