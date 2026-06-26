import { getAllProducts, getProductByEan } from '../services/products.service.js'

export async function listProducts(req, res, next){
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
