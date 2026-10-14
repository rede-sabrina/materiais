import React, { useEffect, useState } from 'react'
import { useModal } from '../components/Modal'
import { createFernandoProduct, deleteFernandoProduct, fetchFernandoProducts, updateFernandoProduct } from '../services/api'
import { ordenarProdutosFernando } from '../data/fernandoProdutos'

export default function FernandoProducts() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [fields, setFields] = useState([])
  const [editing, setEditing] = useState(null)
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
      await createFernandoProduct(name.trim(), fields)
      setName('')
      setFields([])
      await loadProducts()
      showModal({ title: 'Item adicionado', body: 'O item já está disponível para as lojas.', confirmLabel: 'Fechar' })
    } catch (error) {
      console.error(error)
      showModal({ title: 'Erro', body: 'Não foi possível adicionar o item. Ele pode já existir.', confirmLabel: 'Fechar' })
    }

  }

  async function saveFields(product) {
    try {
      await updateFernandoProduct(product._id || product.codigo || product.nome, product.campos || [])
      setEditing(null)
      await loadProducts()
    } catch (error) {
      console.error(error)
      showModal({ title: 'Erro', body: 'Não foi possível salvar os campos extras.', confirmLabel: 'Fechar' })
    }
  }

  function toggleField(product, field) {
    const current = product.campos || []
    const campos = current.includes(field) ? current.filter(item => item !== field) : [...current, field]
    setEditing({ ...product, campos })
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
        <div className="flex flex-wrap items-center gap-2 mb-5">
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
        <p className="text-xs text-slate-500 mb-5">
          Campos extras disponíveis: descrição, modelo, tamanho, cor e observação.
        </p>
        {loading ? (
          <p className="text-slate-400">Carregando estoque...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b text-slate-500"><th className="p-2">Item</th><th className="p-2">Campos extras</th><th className="p-2">Ações</th></tr></thead>
              <tbody>
                {products.map(product => {
                  const current = editing?.nome === product.nome ? editing : product
                  return (
                    <tr key={product._id || product.codigo || product.nome} className="border-b">
                      <td className="p-2 font-medium">{product.nome}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-3">
                          {['descricao', 'modelo', 'tamanho', 'cor', 'observacao'].map(field => (
                            <label key={field} className="flex items-center gap-1">
                              <input type="checkbox" checked={(current.campos || []).includes(field)}
                                     disabled={product.nome === 'Outros'}
                                     onChange={() => toggleField(product, field)} />
                              {field}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {editing?.nome === product.nome ? (
                          <button onClick={() => saveFields(editing)} className="mr-2 px-2 py-1 bg-primary text-white rounded">Salvar</button>
                        ) : (
                          <button onClick={() => setEditing({ ...product, campos: product.campos || [] })} className="mr-2 px-2 py-1 border rounded">Editar campos</button>
                        )}
                        {product.nome !== 'Outros' && <button onClick={() => removeProduct(product)} className="px-2 py-1 text-red-600">Excluir</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
