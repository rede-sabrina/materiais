import React, { useEffect, useState } from 'react'
import UploadDropzone from '../components/UploadDropzone'
import { createReturn } from '../services/api'
import { useModal } from '../components/Modal'
import { useNavigate } from 'react-router-dom'

export default function NewReturn(){
  const [invoice, setInvoice] = useState(null)
  const nav = useNavigate()

  // hooks must be declared unconditionally
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [bulkMotivo, setBulkMotivo] = useState('')
  const [showBulkMotivo, setShowBulkMotivo] = useState(false)
  const [showSobrasModal, setShowSobrasModal] = useState(false)
  const [sobras, setSobras] = useState([])
  const [sobrasDraft, setSobrasDraft] = useState([{ nome: '', ean: '', quantidade: '' }])
  const motivoOptions = ['Avaria','Defeito de Fabricação','Falta','Falta Volume','Desacordo Comercial','Pedido Não Solicitado','Validade Próxima','Vencido','Erro de Digitação','Pedido Duplicado']

  useEffect(()=>{
    const raw = localStorage.getItem('lastParsedInvoice')
    if(raw) setInvoice(JSON.parse(raw))
  }, [])

  // listen for uploads in the same tab and update invoice immediately
  useEffect(()=>{
    function onParsed(e){
      const inv = e?.detail || null
      if(inv) setInvoice(inv)
    }
    window.addEventListener('invoiceParsed', onParsed)
    return ()=> window.removeEventListener('invoiceParsed', onParsed)
  }, [])

  function buildItemKey(item, idx){
    const parts = [item.codigo, item.ean, item.nome, item.lote, idx]
    return parts.filter(v=>v!==undefined && v!==null && v!=='').map(v=>String(v)).join('|')
  }

  // initialize items when invoice loads
  useEffect(()=>{
    if(!invoice) return
    const initialItems = (invoice.items||[]).map((it, idx)=> ({ ...it, _key: buildItemKey(it, idx), selected: false, devolvida: '', motivo: '' }))
    setItems(initialItems)
    setPage(1)
  }, [invoice])

  // message box state
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('info') // 'info' | 'success' | 'error'
  const [isSubmitting, setIsSubmitting] = useState(false)
  function showMessage(text, type='info', timeout=4000){
    setMessage(text)
    setMessageType(type)
    if(timeout>0) setTimeout(()=>{ setMessage(null) }, timeout)
  }
  const { showModal } = useModal()

  if(!invoice) return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Nova Devolução</h2>
      <div className="card">
        <UploadDropzone />
      </div>
    </div>
  )

  function toggleAll(){
    const anyNotSelected = items.some(i=>!i.selected)
    setItems(prev => prev.map(i => {
      if(anyNotSelected){
        // select and set devolvida to available quantity
        const q = i.quantidade ?? i.qtd ?? 0
        return { ...i, selected: true, devolvida: q === undefined ? '' : String(q) }
      }
      // unselect and clear devolvida
      return { ...i, selected: false, devolvida: '' }
    }))
    // if we just selected all, show the bulk motivo box
    if(anyNotSelected) setShowBulkMotivo(true)
    else setShowBulkMotivo(false)
  }

  function openSobrasModal(){
    if(sobras.length > 0){
      setSobrasDraft(sobras.map(s=> ({ nome: s.nome || '', ean: s.ean || '', quantidade: String(s.quantidade ?? '') })))
    } else {
      setSobrasDraft([{ nome: '', ean: '', quantidade: '' }])
    }
    setShowSobrasModal(true)
  }

  function addSobraRow(){
    setSobrasDraft(prev=> [...prev, { nome: '', ean: '', quantidade: '' }])
  }

  function updateSobraRow(idx, patch){
    setSobrasDraft(prev=> prev.map((it,i)=> i===idx ? { ...it, ...patch } : it))
  }

  function removeSobraRow(idx){
    setSobrasDraft(prev=> prev.filter((_,i)=> i!==idx))
  }

  function saveSobras(){
    const normalized = sobrasDraft.map(s=> ({
      nome: String(s.nome || '').trim(),
      ean: String(s.ean || '').trim(),
      quantidadeRaw: String(s.quantidade || '').replace(/[^0-9]/g,'')
    }))
    const cleaned = normalized.map(s=> ({
      nome: s.nome,
      ean: s.ean,
      quantidade: Number(s.quantidadeRaw)
    }))
    const nonEmpty = cleaned.filter(s=> s.nome || s.ean || s.quantidade)
    if(nonEmpty.length === 0){
      setSobras([])
      setShowSobrasModal(false)
      showMessage('Sobras limpas', 'success')
      return
    }
    for(const s of nonEmpty){
      if(!s.nome) return showMessage('Informe o nome do produto nas sobras', 'error')
      if(!s.ean) return showMessage('Informe o cod de barras nas sobras', 'error')
      if(!s.quantidade || isNaN(s.quantidade) || s.quantidade <= 0) return showMessage('Informe quantidades validas nas sobras', 'error')
    }
    setSobras(nonEmpty)
    setShowSobrasModal(false)
    showMessage('Sobras atualizadas', 'success')
  }
  

  function applyBulkMotivo(){
    if(!bulkMotivo) return showMessage('Informe um motivo para aplicar', 'error')
    setItems(prev=> prev.map(it=> it.selected ? { ...it, motivo: bulkMotivo } : it))
    showMessage('Motivo aplicado a itens selecionados', 'success')
    setShowBulkMotivo(false)
    setBulkMotivo('')
  }

  function updateItem(idx, patch){
    setItems(prev=> prev.map((it,i)=> i===idx ? { ...it, ...patch } : it))
  }

  // update by internal item key so duplicates (e.g., different lote) stay independent
  function updateItemByKey(item, patch){
    setItems(prev=> prev.map(it=> (it._key===item._key) ? { ...it, ...patch } : it))
  }

  const filtered = items.filter(i=> i.ean?.toString().includes(query) || i.nome?.toLowerCase().includes(query.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize)
  const hasLote = items.some(i=>i.lote)

  async function handleSubmit(){
    if(isSubmitting) return
    const selected = items.filter(i=>i.selected)
    if(selected.length===0 && sobras.length===0) return showMessage('Selecione pelo menos um item ou adicione sobras', 'error')
    // validate quantities
    for(const it of selected){
      const q = Number(it.devolvida)
      if(!it.devolvida || isNaN(q) || q <= 0) return showMessage('Preencha quantidades válidas para todos os itens selecionados', 'error')
      if(q > Number(it.quantidade)) return showMessage(`Quantidade inválida para ${it.nome}. Máximo disponível: ${it.quantidade}`, 'error')
    }
    for(const s of sobras){
      const q = Number(s.quantidade)
      if(!s.nome || !s.ean || isNaN(q) || q <= 0) return showMessage('Preencha as sobras com nome, cod de barras e quantidade validos', 'error')
    }
    const payload = {
      nota: invoice.nota || '',
      loja: invoice.loja || '',
      data: invoice.data || '',
      distribuidora: invoice.distribuidora || '',
      destinatarioRazaoSocial: invoice.destinatarioRazaoSocial || '',
      destinatarioCnpj: invoice.destinatarioCnpj || '',
      destinatarioEndereco: invoice.destinatarioEndereco || '',
      destinatarioCidade: invoice.destinatarioCidade || '',
      destinatarioEstado: invoice.destinatarioEstado || '',
      destinatarioCep: invoice.destinatarioCep || '',
      items: selected.map(i=> ({ ean: i.ean, nome: i.nome, codigo: i.codigo, quantidade: Number(i.devolvida), motivo: i.motivo })),
      sobras: sobras.map(s=> ({ ean: s.ean, nome: s.nome, quantidade: Number(s.quantidade) }))
    }
    setIsSubmitting(true)
    try{
      await createReturn(payload)
      localStorage.removeItem('lastParsedInvoice')
      showModal({ title: 'Devolução registrada', body: 'Devolução criada com sucesso.', confirmLabel: 'Ver devoluções', onConfirm: ()=> nav('/devolucoes') })
    } catch(e){ console.error(e); showModal({ title: 'Erro', body: 'Erro ao criar devolução', confirmLabel: 'Fechar' }) }
    finally{ setIsSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Nova Pedido</h2>
      <div className="card">
        <div className="mb-4">
          
          <div className="text-sm text-slate-600">Distribuidora: {invoice.distribuidora}</div>
          <div className="text-sm text-slate-600">NF: {invoice.nota}</div>
          <div className="text-sm text-slate-600">Data emissão: {invoice.data}</div>
        </div>

        <div className="mb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input placeholder="Buscar por Cód de Barras ou Nome do Produto" className="border px-3 py-2 rounded" value={query} onChange={e=>{ setQuery(e.target.value); setPage(1) }} />
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }} className="border px-2 py-1 rounded">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            <button onClick={openSobrasModal} className="px-3 py-1 bg-primary text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Adicionar Sobra de Produto +</button>
          </div>
          <div>
            <button onClick={toggleAll} className="px-3 py-1 bg-primary text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Devolução Total</button>
          </div>
        </div>

        {showBulkMotivo && (
          <div className="mb-4 p-3 bg-slate-50 border rounded flex items-center gap-2">
            <select className="flex-1 border px-3 py-2 rounded" value={bulkMotivo} onChange={e=>setBulkMotivo(e.target.value)}>
              <option value="">Selecione o motivo para todos os itens</option>
              {motivoOptions.map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={applyBulkMotivo} className="px-3 py-2 bg-primary text-white rounded">Aplicar a todos</button>
            <button onClick={()=>{ setShowBulkMotivo(false); setBulkMotivo('') }} className="px-3 py-2 border rounded">Cancelar</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-sm text-slate-700">
                <th className="p-3 w-6"></th>
                <th className="p-3">Nome do produto</th>
                <th className="p-3">Código do produto</th>
                <th className="p-3">Código de barras</th>
                {hasLote && <th className="p-3">Lote</th>}
                <th className="p-3">Quantidade disponível</th>
                <th className="p-3">Quantidade a devolver</th>
                <th className="p-3">Motivo da devolução</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item, idx)=> (
                <tr key={item._key || `${item.codigo}-${item.ean}-${idx}`} className="border-t">
                  <td className="p-2 align-top">
                    <input type="checkbox" checked={!!item.selected} onChange={(e)=>updateItemByKey(item, { selected: e.target.checked })} />
                  </td>
                  <td className="p-2 align-top max-w-xs">
                    <div className="font-medium">{item.nome}</div>
                  </td>
                  <td className="p-2 align-top">{item.codigo}</td>
                  <td className="p-2 align-top">{item.ean}</td>
                  {hasLote && <td className="p-2 align-top">{item.lote || '—'}</td>}
                  <td className="p-2 align-top">{item.quantidade}</td>
                  <td className="p-2 align-top">
                    <input className="border px-2 py-1 rounded w-32" value={item.devolvida} disabled={!item.selected}
                      onChange={e=>{
                        const raw = String(e.target.value).replace(/[^0-9]/g,'')
                        if(raw === ''){ updateItemByKey(item, { devolvida: '' }); return }
                        let num = Number(raw)
                        const max = Number(item.quantidade) || 0
                        if(num > max) num = max
                        updateItemByKey(item, { devolvida: String(num) })
                      }}
                    />
                    {item.selected && item.devolvida!=='' && Number(item.devolvida) > Number(item.quantidade) && (
                      <div className="text-xs text-red-600">Máx: {item.quantidade}</div>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    <select className="border px-2 py-1 rounded w-56" value={item.motivo} disabled={!item.selected} onChange={e=>updateItemByKey(item, { motivo: e.target.value })}>
                      <option value="">Selecione o motivo</option>
                      {motivoOptions.map(m=> <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sobras.length > 0 && (
          <div className="mt-6">
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Sobras (fora da nota)</div>
                <button onClick={openSobrasModal} className="px-3 py-1 border rounded text-sm">Editar sobras</button>
              </div>
              <div className="space-y-2">
                {sobras.map((s, idx)=> (
                  <div key={`${s.ean}-${idx}`} className="p-3 border rounded text-sm">
                    <div className="font-medium">{s.nome}</div>
                    <div className="text-slate-500">EAN: {s.ean || '—'} • Quantidade: {s.quantidade}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">Mostrando {filtered.length} itens — Página {page} de {totalPages}</div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setPage(Math.max(1,page-1))} className="px-2 py-1 border rounded">Anterior</button>
            <button onClick={()=>setPage(Math.min(totalPages,page+1))} className="px-2 py-1 border rounded">Próxima</button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={handleSubmit} disabled={isSubmitting} aria-busy={isSubmitting} className={`px-4 py-2 ${isSubmitting ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary'} text-white rounded`}>{isSubmitting ? 'Enviando...' : 'Enviar Devolução'}</button>
          <button onClick={()=>{ localStorage.removeItem('lastParsedInvoice'); setInvoice(null) }} className="px-4 py-2 border rounded">Cancelar</button>
        </div>
      </div>
      {showSobrasModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-3xl max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-3">Adicionar sobras</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {sobrasDraft.map((s, idx)=> (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="text-sm">Nome do produto</label>
                    <input className="w-full border px-2 py-1 rounded mt-1" value={s.nome} onChange={e=>updateSobraRow(idx, { nome: e.target.value })} />
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm">Cod de barras</label>
                    <input inputMode="numeric" className="w-full border px-2 py-1 rounded mt-1" value={s.ean} onChange={e=>updateSobraRow(idx, { ean: e.target.value.replace(/[^0-9]/g,'') })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm">Quantidade</label>
                    <input type="number" min="1" step="1" inputMode="numeric" className="w-full border px-2 py-1 rounded mt-1" value={s.quantidade} onChange={e=>updateSobraRow(idx, { quantidade: e.target.value })} />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button onClick={()=>removeSobraRow(idx)} className="px-2 py-1 border rounded text-sm">Remover</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 flex items-center justify-between">
              <button onClick={addSobraRow} className="px-3 py-1 border rounded text-sm">+ Adicionar produto</button>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 border rounded" onClick={()=>setShowSobrasModal(false)}>Cancelar</button>
                <button className="px-3 py-1 bg-primary text-white rounded" onClick={saveSobras}>Salvar sobras</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {message && (
        <div className={`fixed z-50 bottom-6 right-6 max-w-md w-full p-3 rounded shadow-lg border ${messageType==='error' ? 'bg-red-50 border-red-200 text-red-800' : messageType==='success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
