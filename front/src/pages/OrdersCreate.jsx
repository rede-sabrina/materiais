import React, { useEffect, useState } from 'react'
import { fetchProducts, createOrder } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../components/Modal'

export default function OrdersCreate(){
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState({}) // ean -> { product, qty, selected }
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15
  const nav = useNavigate()
  const { showModal } = useModal()

  // load products once
  useEffect(()=>{
    fetchProducts().then(setProducts).catch(()=>setProducts([]))
  }, [])

  // toggle checkbox
  function toggleSelect(ean, checked){
    const product = products.find(p=>p.ean===ean) || {}
    setSelection(prev=>({
      ...prev,
      [ean]: {
        ...(prev[ean]||{}),
        selected: checked,
        qty: checked ? (prev[ean]?.qty || 1) : '',
        product
      }
    }))
  }

  function updateQty(ean, raw){
    const qty = raw.replace(/[^0-9]/g,'')
    setSelection(prev=>({
      ...prev,
      [ean]: { ...(prev[ean]||{}), qty, product: prev[ean]?.product }
    }))
  }

  async function handleSubmit(){
    const items = Object.entries(selection)
      .filter(([,v])=> v.selected && v.qty && Number(v.qty)>0)
      .map(([,v])=>({
        ean: v.product?.ean,
        nome: v.product?.nome,
        codigo: v.product?.codigo,
        quantidade: Number(v.qty)
      }))
    if(items.length===0){
      alert('Selecione ao menos um produto e informe a quantidade')
      return
    }
    // mostra modal de carregamento
    showModal({ title:'Criando Pedido', loading:true, hideActions:true })
    try{
      await createOrder({ itens: items })
      showModal({
        title: 'Pedido criado',
        body: 'Pedido registrado com sucesso.',
        confirmLabel: 'Fechar',
        onConfirm: ()=> nav('/') // voltar ao dashboard
      })
    }catch(e){
      console.error(e)
      showModal({
        title: 'Erro',
        body: 'Erro ao criar pedido.',
        confirmLabel: 'Fechar'
      })
    }
  }

  const filtered = products.filter(p=> p.nome?.toLowerCase().includes(query.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Novo Pedido – Seleção de Produtos</h2>
      <div className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <input placeholder="Buscar por nome" className="border px-3 py-2 rounded flex-1" value={query} onChange={e=>{ setQuery(e.target.value); setPage(1) }} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-sm text-slate-700">
                <th className="p-3 w-6"></th>
                <th className="p-3">Nome</th>
                <th className="p-3">Código</th>
                <th className="p-3">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p=>{
                const sel = selection[p.ean]||{}
                return (
                  <tr key={p.ean} className="border-t">
                    <td className="p-2 align-top">
                      <input type="checkbox" checked={!!sel.selected} onChange={e=>toggleSelect(p.ean, e.target.checked)} />
                    </td>
                    <td className="p-2 align-top">{p.nome}</td>
                    <td className="p-2 align-top">{p.codigo || '—'}</td>
                    <td className="p-2 align-top">
                      <input type="number" min="1" className="border px-2 py-1 rounded w-20" disabled={!sel.selected} value={sel.qty||''} onChange={e=>updateQty(p.ean, e.target.value)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between mt-4">
          <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <span className="self-center">Página {page} de {totalPages}</span>
          <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded">Criar Pedido</button>
        </div>
      </div>
    </div>
  )
}
