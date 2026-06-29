import React, { useEffect, useState } from 'react'
import { fetchProducts, createOrder } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../components/Modal'

export default function OrdersCreate(){
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState({}) // ean -> { product, qty, selected }
  const nav = useNavigate()
  const { showModal } = useModal()

  // load products once
  useEffect(()=>{
    fetchProducts().then(setProducts).catch(()=>setProducts([]))
  }, [])

  // update selection (checkbox)
  function toggleSelect(ean, checked){
    setSelection(prev=>({
      ...prev,
      [ean]: {
        ...(prev[ean] || {}),
        selected: checked,
        // keep previous qty or reset
        qty: checked ? (prev[ean]?.qty || 1) : ''
      }
    }))
  }

  function updateQty(ean, raw){
    const qty = raw.replace(/[^0-9]/g,'')
    setSelection(prev=>({
      ...prev,
      [ean]: { ...(prev[ean]||{}), qty }
    }))
  }

  async function handleSubmit(){
    const items = Object.entries(selection)
      .filter(([,v])=> v.selected && v.qty && Number(v.qty) > 0)
      .map(([,v])=>({
        ean: v.product.ean,
        nome: v.product.nome,
        codigo: v.product.codigo,
        quantidade: Number(v.qty)
      }))
    if(items.length===0){
      alert('Selecione ao menos um produto e informe a quantidade')
      return
    }
    try{
      await createOrder({ itens: items })
      showModal({
        title: 'Pedido criado',
        body: 'Pedido registrado com sucesso.',
        confirmLabel: 'Ver pedidos',
        onConfirm: ()=> nav('/pedidos')
      })
    }catch(e){
      console.error(e)
      alert('Erro ao criar pedido')
    }
  }

  const filtered = products.filter(p=> p.nome?.toLowerCase().includes(query.toLowerCase()) || p.ean?.includes(query))

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Novo Pedido – Seleção de Produtos</h2>
      <div className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <input placeholder="Buscar por nome ou EAN" className="border px-3 py-2 rounded flex-1" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-sm text-slate-700">
                <th className="p-3 w-6"></th>
                <th className="p-3">Nome</th>
                <th className="p-3">EAN</th>
                <th className="p-3">Código</th>
                <th className="p-3">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>{
                const sel = selection[p.ean] || {}
                return (
                  <tr key={p.ean} className="border-t">
                    <td className="p-2 align-top">
                      <input type="checkbox" checked={!!sel.selected} onChange={e=>toggleSelect(p.ean, e.target.checked)} />
                    </td>
                    <td className="p-2 align-top">{p.nome}</td>
                    <td className="p-2 align-top">{p.ean}</td>
                    <td className="p-2 align-top">{p.codigo || '—'}</td>
                    <td className="p-2 align-top">
                      <input type="number" min="1" className="border px-2 py-1 rounded w-20" disabled={!sel.selected} value={sel.qty||''}
                             onChange={e=>updateQty(p.ean, e.target.value)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded">Criar Pedido</button>
        </div>
      </div>
    </div>
  )
}
