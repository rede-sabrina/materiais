import React, {useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import { fetchReturns, fetchReturnById, fetchUsers, fetchMe } from '../services/api'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import { generateReturnTermPdf } from '../utils/returnTermPdf'
import distribuidoraMap, { normalize } from '../utils/distribuidoraMap'

export default function ReturnsList(){
  const [data, setData] = useState([])
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lojaFilter, setLojaFilter] = useState('')
  const [lojas, setLojas] = useState([])
  const [users, setUsers] = useState([])
  const [me, setMe] = useState(null)
  const [distribFilter, setDistribFilter] = useState('')
  const [distribs, setDistribs] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  function parseJwt(token){
    try{
      if(!token) return null
      const parts = token.split('.')
      if(parts.length<2) return null
      const payload = parts[1]
      const b = payload.replace(/-/g, '+').replace(/_/g, '/')
      const json = decodeURIComponent(atob(b).split('').map(c=> '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))
      return JSON.parse(json)
    } catch(e){ return null }
  }

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'
  const statusOptionsAdmin = ['Pendente','Solicitado','Coletado','Concluído','Negado']
  const statusOptionsLoja = ['Pendente','Solicitado','Coletado']

  async function load(params){
    try{
      const list = await fetchReturns(params)
      setData(list)
    } catch(err){ console.error(err); setData([]) }
  }

  useEffect(()=>{
    load()
    fetchMe().then(setMe).catch(()=>{})
    if(isAdmin){
      fetchUsers().then(u=>{
        try{
          const arr = (u || []).map(x=> x.loja || x.username).filter(Boolean)
          const unique = Array.from(new Set(arr))
          setLojas(unique)
          setUsers(u || [])
        }catch(e){ setLojas([]) }
      }).catch(()=>{})
    }
  }, [])

  useEffect(()=>{
    try{
      const arr = (data || []).map(i => {
        const raw = i.distribuidora || 'Não informado'
        return distribuidoraMap[normalize(raw)] || raw
      })
      const unique = Array.from(new Set(arr))
      setDistribs(unique)
    }catch(e){ setDistribs([]) }
  }, [data])

  const filtered = data.filter(d=> (
    (statusFilter ? d.status === statusFilter : true)
    && (isAdmin && lojaFilter ? (d.loja||'') === lojaFilter : true)
    && (distribFilter ? ((distribuidoraMap[normalize(d.distribuidora || '')] || (d.distribuidora||'')) === distribFilter) : true)
  ))
  const sorted = [...filtered].sort((a, b)=>{
    const da = new Date(a.createdAt || a.data || 0)
    const db = new Date(b.createdAt || b.data || 0)
    return db - da
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page-1)*pageSize, page*pageSize)

  function formatDate(value){
    if(!value) return '—'
    try{
      const d = new Date(value)
      return d.toLocaleString()
    } catch(e){ return String(value) }
  }

  function resolveStoreForReturn(ret){
    if(isAdmin){
      const store = (users || []).find(u => (u.loja || u.username) === ret.loja)
      return store || null
    }
    return me
  }

  async function handleGenerateTerm(ret){
    const store = resolveStoreForReturn(ret)
    const idToUse = ret._id || ret.id
    let fullReturn = ret
    try{
      if(idToUse) fullReturn = await fetchReturnById(idToUse)
    } catch(e){ console.error(e) }
    await generateReturnTermPdf(fullReturn, store)
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Devoluções</h2>

        <div className="flex items-center justify-between mt-3 flex-wrap">
          <div className="flex gap-3 flex-wrap items-center">
            {isAdmin && (
              <select value={lojaFilter} onChange={(e)=>setLojaFilter(e.target.value)} className="border px-2 py-1 rounded text-sm h-8">
                <option value="">Todas as lojas</option>
                {lojas.map(l=> <option key={l} value={l}>{l}</option>)}
              </select>
            )}
            <select value={distribFilter} onChange={e=>setDistribFilter(e.target.value)} className="border px-2 py-1 rounded text-sm h-8">
              <option value="">Todas as distribuidoras</option>
              {distribs.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border px-2 py-1 rounded text-sm h-8">
              <option value="">Todos</option>
              {(isAdmin ? statusOptionsAdmin : statusOptionsLoja).map(s=> (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input type="date" className="border px-2 py-1 rounded text-sm h-8" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            <input type="date" className="border px-2 py-1 rounded text-sm h-8" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            <button className="px-2 py-1 border rounded text-sm h-8" onClick={() => { setPage(1); load({ status: statusFilter, loja: isAdmin ? lojaFilter : undefined, startDate, endDate }) }}>Filtrar</button>
          </div>

          <div className="w-full mt-2 flex justify-end">
            <Link to="/devolucoes/novo" className="px-3 py-1 bg-primary text-white rounded text-sm h-8 inline-flex items-center transition-all duration-200 hover:brightness-95 hover:shadow-md hover:-translate-y-0.5">Nova devolução</Link>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-md shadow p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="p-2">Nota</th>
              <th>NFD</th>
              <th>Loja</th>
              <th>Status</th>
              <th>Data registro</th>
              <th>Ações</th>
              {isAdmin && <th>NFD Anexada</th>}
            </tr>
          </thead>
          <tbody>
            {pageItems.map(r=> (
              <tr key={r._id || r.id} className="border-t">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/devolucoes/${r._id || r.id}`} className="text-primary">{r.nota}</Link>
                  </div>
                </td>
                <td className="text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${r.nfdNumber ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.nfdNumber ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td>{r.loja}</td>
                <td><Badge>{r.status}</Badge></td>
                <td className="text-sm text-slate-500">{formatDate(r.createdAt || r.data)}</td>
                <td>
                  <Link to={`/devolucoes/${r._id || r.id}`} className="px-3 py-1 bg-primary text-white rounded text-sm transition transform hover:-translate-y-1 hover:scale-105">Visualizar</Link>
                  <button onClick={()=>handleGenerateTerm(r)} className="ml-2 px-3 py-1 border rounded text-sm transition transform hover:-translate-y-1 hover:scale-105">Gerar termo</button>
                </td>
                {isAdmin && (
                  <td className="text-center">
                    {(() => {
                      const dist = distribuidoraMap[normalize(r.distribuidora || '')] || (r.distribuidora || '')
                      if(dist === 'Santa Cruz' || dist === 'Panpharma'){
                        return (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${r.notaAnexada ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {r.notaAnexada ? 'Sim' : 'Não'}
                          </span>
                        )
                      }
                      return <span className="text-slate-400">—</span>
                    })()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">Mostrando {pageItems.length} de {filtered.length}</div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
