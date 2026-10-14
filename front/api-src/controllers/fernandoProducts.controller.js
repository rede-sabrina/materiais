import { createFernandoProduct, deleteFernandoProduct, getFernandoProducts } from '../services/fernandoProducts.service.js'

export async function listFernandoProducts(req, res, next) {
  try { res.json(await getFernandoProducts()) } catch (err) { next(err) }
}

export async function addFernandoProduct(req, res, next) {
  try {
    if (typeof req.body?.nome !== 'string' || !req.body.nome.trim()) {
      return res.status(400).json({ message: 'nome é obrigatório' })
    }
    res.status(201).json(await createFernandoProduct(req.body.nome))
  } catch (err) {
    if (err.message === 'Produto já cadastrado') return res.status(409).json({ message: err.message })
    next(err)
  }
}

export async function removeFernandoProduct(req, res, next) {
  try {
    if (!await deleteFernandoProduct(req.params.id)) return res.status(404).json({ message: 'Produto não encontrado' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}
