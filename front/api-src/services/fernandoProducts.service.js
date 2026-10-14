import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import FernandoProductModel from '../models/FernandoProduct.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaults = JSON.parse(readFileSync(join(__dirname, '../data/fernando-products.json'), 'utf8'))
let fallbackProducts = defaults.map((p, i) => ({ ...p, codigo: `F${String(i + 1).padStart(2, '0')}`, active: true }))

export async function getFernandoProducts() {
  try {
    if (FernandoProductModel.find) {
      const allItems = await FernandoProductModel.find().lean()
      if (!allItems.length) {
        await FernandoProductModel.insertMany(defaults, { ordered: false })
      }
      return await FernandoProductModel.find({ active: true }).lean()
    }
  } catch (err) {
    console.error('Erro ao carregar catálogo do Fernando:', err.message)
  }
  return fallbackProducts.filter(p => p.active !== false)
}

export async function createFernandoProduct(nome, campos = []) {
  const normalized = nome.trim()
  if (!normalized) throw new Error('Nome do produto é obrigatório')
  try {
    if (FernandoProductModel.create) return (await FernandoProductModel.create({ nome: normalized, campos })).toObject()
  } catch (err) {
    if (err.code === 11000) throw new Error('Produto já cadastrado')
    console.error('Erro ao cadastrar produto do Fernando:', err.message)
  }
  if (fallbackProducts.some(p => p.nome.toLowerCase() === normalized.toLowerCase() && p.active !== false)) {
    throw new Error('Produto já cadastrado')
  }
  const product = { nome: normalized, campos, codigo: `F${Date.now()}`, active: true }
  fallbackProducts.push(product)
  return product
}

export async function updateFernandoProduct(id, updates) {
  const campos = Array.isArray(updates.campos) ? updates.campos : []
  try {
    if (FernandoProductModel.findOneAndUpdate) {
      const updated = await FernandoProductModel.findOneAndUpdate(
        { _id: id }, { campos }, { new: true, runValidators: true }
      ).lean()
      return updated
    }
  } catch (err) {
    console.error('Erro ao atualizar campos do produto do Fernando:', err.message)
  }
  const product = fallbackProducts.find(p => p.codigo === id || p.nome === id)
  if (!product) return null
  product.campos = campos
  return product
}

export async function deleteFernandoProduct(id) {
  try {
    if (FernandoProductModel.findOneAndUpdate) {
      const updated = await FernandoProductModel.findOneAndUpdate({ _id: id }, { active: false }, { new: true }).lean()
      return Boolean(updated)
    }
  } catch (err) {
    console.error('Erro ao excluir produto do Fernando:', err.message)
  }
  const index = fallbackProducts.findIndex(p => p.codigo === id || p.nome === id)
  if (index === -1) return false
  fallbackProducts[index].active = false
  return true
}
