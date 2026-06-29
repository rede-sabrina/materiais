import React, { useEffect, useState } from 'react'
import { fetchProducts, createOrder } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../components/Modal'

export default function NewOrder(){
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([]) // { product, quantidade }
  const [query, setQuery] = useState('')
  const nav = useNavigate()
  const { showModal } = useModal()

  // load product catalog
  useEffect(()=>{
    fetchProducts().then(setProducts).catch(()=>setProducts([]))
  }, [])

  function addEmptyItem(){
    setItems(prev=>[...prev, { product: null, quantidade: '' }])
  }

  function updateItem(idx, patch){
    setItems(prev=>prev.map((it,i)=> i===idx ? { ...it, ...patch } : it))
  }

  async function handleSubmit(){
    const filtered = items.filter(it=> it.product && it.quantidade && Number(it.quantidade) > 0)
    if(filtered.length===0) return alert('Adicione ao menos um produto com quantidade')
    const payload = {
      itens: filtered.map(it=>({
        ean: it.product.ean,
        nome: it.product.nome,
        codigo: it.product.codigo,
        quantidade: Number(it.quantidade)
      }))
    }
    try{
      await createOrder(payload)
      showModal({
        title: 'Pedido criado',
        body: 'O pedido foi registrado com sucesso.',
        confirmLabel: 'Ver pedidos',
        onConfirm: ()=> nav('/pedidos')
      })
    }catch(e){
      console.error(e)
      alert('Erro ao criar pedido')
    }
  }

  const filteredProducts = products.filter(p=> p.nome.toLowerCase().includes(query.toLowerCase()) || p.ean.includes(query))

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Novo Pedido</h2>
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <input placeholder="Buscar produto por nome ou EAN" className="border px-3 py-2 rounded flex-1" value={query} onChange={e=>setQuery(e.target.value)} />
          <button onClick={addEmptyItem} className="px-3 py-1 bg-primary text-white rounded">+ Item</button>
        </div>
        {items.map((it, idx)=>(
          <div key={idx} className="flex items-center gap-2 mb-2">
            <select className="border px-2 py-1 rounded flex-1" value={it.product?.ean||''} onChange={e=>{
              const sel = products.find(p=>p.ean===e.target.value)
              updateItem(idx, { product: sel })
            }}>
              <option value="">Selecione o produto</option>
              {filteredProducts.map(p=>(
                <option key={p.ean} value={p.ean}>{p.nome} ({p.ean})</option>
              ))}
            </select>
            <input type="number" min="1" placeholder="Qtd" className="border px-2 py-1 rounded w-24" value={it.quantidade} onChange={e=>updateItem(idx,{ quantidade: e.target.value })} />
            <button onClick={()=> setItems(prev=>prev.filter((_,i)=>i!==idx))} className="px-2 py-1 border rounded text-sm">Remover</button>
          </div>
        ))}
        <div className="mt-4">
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded">Salvar Pedido</button>
        </div>
      </div>
    </div>
  )
}
