import React, { useEffect, useState } from 'react'
import { useModal } from '../components/Modal'
import { createFernandoProduct, deleteFernandoProduct, fetchFernandoProducts } from '../services/api'
import { ordenarProdutosFernando } from '../data/fernandoProdutos'

export default function FernandoProducts() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const { showModal } = useModal()

  async function loadProducts() {
    setLoading(true)
    try {
      setProducts(ordenarProdutosFernando(await fetchFernandoProducts()))
    } catch (error) {
      console.error(error)
      showModal({ title: 'Erro', body: 'Não foi possível carregar o estoque do Fernando.', confirmLabel: 'Fechar' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  async function addProduct() {
    if (!name.trim()) {
      alert('Preencha o nome do item')
      return
    }
    try {
      await createFernandoProduct(name.trim())
      setName('')
      await loadProducts()
      showModal({ title: 'Item adicionado', body: 'O item já está disponível para as lojas.', confirmLabel: 'Fechar' })
    } catch (error) {
      console.error(error)
      showModal({ title: 'Erro', body: 'Não foi possível adicionar o item. Ele pode já existir.', confirmLabel: 'Fechar' })
    }
  }

  function removeProduct(product) {
    showModal({
      title: 'Excluir item',
      body: `Remover "${product.nome}" da lista de pedidos?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteFernandoProduct(product._id || product.codigo || product.nome)
          await loadProducts()
          showModal({ title: 'Item removido', body: 'O item não aparecerá mais para as lojas.', confirmLabel: 'Fechar' })
        } catch (error) {
          console.error(error)
          showModal({ title: 'Erro', body: 'Não foi possível remover o item.', confirmLabel: 'Fechar' })
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Estoque do Fernando</h2>
      <div className="card p-4">
        <p className="text-sm text-slate-500 mb-3">
          Adicione ou retire itens que as lojas podem solicitar nos pedidos para você.
        </p>
        <div className="flex items-center gap-2 mb-5">
          <input
            placeholder="Nome do item"
            className="border px-3 py-2 rounded w-72"
            value={name}
            onChange={event => setName(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') addProduct() }}
          />
          <button onClick={addProduct} className="px-3 py-2 bg-primary text-white rounded">
            Adicionar item
          </button>
        </div>
        {loading ? (
          <p className="text-slate-400">Carregando estoque...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {products.map(product => (
              <span key={product._id || product.codigo || product.nome}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
                {product.nome}
                {product.nome !== 'Outros' && (
                  <button type="button" onClick={() => removeProduct(product)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Excluir ${product.nome}`}>×</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
