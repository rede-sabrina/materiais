import { getAllProducts, getProductByEan, createNewProduct, setProductActive } from '../services/products.service.js'

export async function listProducts(req, res, next){
  // existing
  try{
    const items = await getAllProducts(req.query.q)
    res.json(items)
  } catch(err){ next(err) }
}

export async function getProduct(req, res, next){
  try{
    const p = await getProductByEan(req.params.ean)
    if(!p) return res.status(404).json({ message: 'Produto não encontrado' })
    res.json(p)
  } catch(err){ next(err) }
}

// CREATE new product – admin only (full payload)
export async function createProduct(req, res, next){
  try{
    const { codigo, ean, nome, quantidade } = req.body
    if(!codigo || !ean || !nome) return res.status(400).json({ message: 'codigo, ean e nome são obrigatórios' })
    const created = await createNewProduct({ codigo, ean, nome, quantidade })
    res.status(201).json(created)
  } catch(err){ next(err) }
}

// CREATE new product – simple (sem ean, usado pelo admin UI atual)
export async function createProductSimple(req, res, next){
  try{
    const { codigo, nome, quantidade } = req.body
    if(!codigo || !nome) return res.status(400).json({ message: 'codigo e nome são obrigatórios' })
    const ean = Date.now().toString() // placeholder EAN
    const created = await createNewProduct({ codigo, ean, nome, quantidade })
    res.status(201).json(created)
  }catch(err){ next(err) }
}

// Desativar produto (admin)
export async function deactivateProduct(req, res, next){
  try{
    const { codigo } = req.params
    const updated = await setProductActive(codigo, false)
    if(!updated) return res.status(404).json({ message: 'Produto não encontrado' })
    res.json(updated)
  }catch(err){ next(err) }
}
