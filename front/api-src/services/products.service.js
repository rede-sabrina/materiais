import ProductModel from '../models/Product.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const productsPath = join(__dirname, '../data/products.json')
let products = []
try {
  products = JSON.parse(readFileSync(productsPath, 'utf8'))
} catch (e) {
  products = []
}

export async function getAllProducts(q){
  try{
    if(ProductModel && ProductModel.find){
      const filter = q ? { $or: [ { nome: { $regex: q, $options: 'i' } }, { ean: { $regex: q } } ] } : {}
      return await ProductModel.find(filter).lean()
    }
  } catch(e){}
  let items = [...products]
  if(q) items = items.filter(p => p.nome.toLowerCase().includes(q.toLowerCase()) || p.ean.includes(q))
  return items
}

export async function getProductByEan(ean){
  try{
    if(ProductModel && ProductModel.findOne) return await ProductModel.findOne({ ean }).lean()
  } catch(e){}
  return products.find(p => p.ean === ean)
}

export async function createNewProduct({ codigo, ean, nome, quantidade }){
  try{
    if(ProductModel && ProductModel.create){
      const doc = await ProductModel.create({ codigo, ean, nome, quantidade })
      return doc.toObject()
    }
  }catch(e){}
  const item = { codigo, ean, nome, quantidade }
  // add to in‑memory list (fallback)
  products.unshift(item)
  return item
}

export async function setProductActive(codigo, active){
  try{
    if(ProductModel && ProductModel.findOneAndUpdate){
      const doc = await ProductModel.findOneAndUpdate({ codigo }, { active }, { new:true }).lean()
      return doc
    }
  }catch(e){}
  const idx = products.findIndex(p=>p.codigo===codigo)
  if(idx!==-1){
    products[idx].active = active
    return products[idx]
  }
  return null
}

export default { getAllProducts, getProductByEan, createNewProduct, setProductActive }
