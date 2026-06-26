import ProductModel from '../models/Product.js'
import { readFileSync } from 'fs'
import { join } from 'path'

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

export default { getAllProducts, getProductByEan }
