import React, { useEffect, useState } from 'react'
import { fetchAuditEvents, fetchMe, deleteAuditEvents } from '../services/api'

export default function AuditLog(){
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [action, setAction] = useState('')
  const [nota, setNota] = useState('')
  const [loja, setLoja] = useState('')
  const [actor, setActor] = useState('')

  async function load(params){
    try{
      const me = await fetchMe()
      if(!me || me.role !== 'ADMIN'){
        setAccessDenied(true)
        setLoading(false)
        return
      }
      const list = await fetchAuditEvents({ limit: 200, ...params })
      setEvents(Array.isArray(list) ? list : [])
    } catch(e){ console.error(e) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  function formatDate(value){
    if(!value) return '—'
    try{ return new Date(value).toLocaleString() } catch(e){ return String(value) }
  }

  function renderAction(evt){
    if(evt.action === 'STATUS_CHANGED') return 'Status alterado'
    if(evt.action === 'NFD_UPDATED') return 'NFD atualizada'
    if(evt.action === 'RETURN_CREATED') return 'Devolucao criada'
    if(evt.action === 'RETURN_DELETED') return 'Devolucao excluida'
    return evt.action || '—'
  }

  function renderDetails(evt){
    const changes = evt.changes || {}
    if(evt.action === 'STATUS_CHANGED' && changes.status){
      return `${changes.status.from || '—'} -> ${changes.status.to || '—'}`
    }
    if(evt.action === 'NFD_UPDATED'){
      const parts = Object.keys(changes).map(k=>{
        const c = changes[k]
        return `${k}: ${c?.from ?? '—'} -> ${c?.to ?? '—'}`
      })
      return parts.length ? parts.join(' | ') : '—'
    }
    return '—'
  }

  if(loading) return <div>Carregando auditoria...</div>
  if(accessDenied) return <div>Acesso restrito: somente administradores</div>

  function applyFilters(){
    setLoading(true)
    load({ startDate, endDate, action, nota, loja, actor })
  }

  function clearFilters(){
    setStartDate('')
    setEndDate('')
    setAction('')
    setNota('')
    setLoja('')
    setActor('')
    setLoading(true)
    load({})
  }

  function exportPdf(){
    window.print()
  }

  async function handleDelete(){
    const hasFilters = !!(startDate || endDate || action || nota || loja || actor)
    const msg = hasFilters
      ? 'Tem certeza que deseja limpar os logs filtrados?'
      : 'Tem certeza que deseja limpar TODOS os logs?'
    if(!window.confirm(msg)) return
    try{
      await deleteAuditEvents({ startDate, endDate, action, nota, loja, actor })
      setLoading(true)
      load({ startDate, endDate, action, nota, loja, actor })
    } catch(e){ console.error(e) }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Auditoria</h2>
      <div className="bg-white p-3 rounded shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block">Início</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="text-sm block">Fim</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="text-sm block">Ação</label>
          <select value={action} onChange={e=>setAction(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">Todas</option>
            <option value="STATUS_CHANGED">Status alterado</option>
            <option value="NFD_UPDATED">NFD atualizada</option>
            <option value="RETURN_CREATED">Devolucao criada</option>
            <option value="RETURN_DELETED">Devolucao excluida</option>
          </select>
        </div>
        <div>
          <label className="text-sm block">Nota</label>
          <input value={nota} onChange={e=>setNota(e.target.value)} className="border px-2 py-1 rounded" placeholder="NF" />
        </div>
        <div>
          <label className="text-sm block">Loja</label>
          <input value={loja} onChange={e=>setLoja(e.target.value)} className="border px-2 py-1 rounded" placeholder="Loja" />
        </div>
        <div>
          <label className="text-sm block">Usuário</label>
          <input value={actor} onChange={e=>setActor(e.target.value)} className="border px-2 py-1 rounded" placeholder="Usuário" />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={applyFilters} className="px-3 py-1 bg-primary text-white rounded">Aplicar filtros</button>
          <button onClick={clearFilters} className="px-3 py-1 border rounded">Limpar filtros</button>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={exportPdf} className="px-3 py-1 bg-primary text-white rounded">Exportar PDF (imprimir)</button>
        <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">Limpar logs</button>
      </div>
      <div className="bg-white p-4 rounded shadow-sm">
        {events.length === 0 ? (
          <div className="text-sm text-slate-500">Sem eventos recentes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-sm text-slate-700">
                  <th className="p-3">Data</th>
                  <th className="p-3">Ação</th>
                  <th className="p-3">Nota</th>
                  <th className="p-3">Loja</th>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt, idx)=> (
                  <tr key={evt._id || evt.id || idx} className="border-t text-sm">
                    <td className="p-2 align-top">{formatDate(evt.createdAt)}</td>
                    <td className="p-2 align-top">{renderAction(evt)}</td>
                    <td className="p-2 align-top">{evt.nota || '—'}</td>
                    <td className="p-2 align-top">{evt.loja || '—'}</td>
                    <td className="p-2 align-top">{evt.actor?.username || evt.actor?.loja || '—'}</td>
                    <td className="p-2 align-top">{renderDetails(evt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
