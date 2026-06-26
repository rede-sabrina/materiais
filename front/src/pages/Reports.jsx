import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import { fetchReportSummary, fetchMe, fetchReturns } from '../services/api'

export default function Reports(){
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [view, setView] = useState('both') // 'both' | 'loja' | 'dist'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterLoja, setFilterLoja] = useState('')
  const [filterDist, setFilterDist] = useState('')
  const [lojasOptions, setLojasOptions] = useState([])
  const [distOptions, setDistOptions] = useState([])
  const [groupedByLoja, setGroupedByLoja] = useState([])

  useEffect(()=>{ async function load(){
    try{
      const me = await fetchMe()
      if(!me || me.role !== 'ADMIN'){
        setAccessDenied(true)
        setLoading(false)
        return
      }
      const s = await fetchReportSummary(); setSummary(s)
      // load options (distinct lojas/distribuidoras) from returns
      try{
        const all = await fetchReturns()
        const lojas = Array.from(new Set((all||[]).map(i=> i.loja).filter(Boolean))).sort()
        const dists = Array.from(new Set((all||[]).map(i=> i.distribuidora).filter(Boolean))).sort()
        setLojasOptions(lojas)
        setDistOptions(dists)
        // compute groupedByLoja initial
        try{
          const map = {}
          ;(all||[]).forEach(it=>{
            const loja = it.loja || '—'
            const dist = it.distribuidora || '—'
            const v = Number(it.nfdValue) || 0
            if(!map[loja]) map[loja] = { loja, totalValue: 0, count: 0, distribuidoras: {} }
            map[loja].totalValue += v
            map[loja].count += 1
            if(!map[loja].distribuidoras[dist]) map[loja].distribuidoras[dist] = { distribuidora: dist, totalValue: 0, count: 0 }
            map[loja].distribuidoras[dist].totalValue += v
            map[loja].distribuidoras[dist].count += 1
          })
          setGroupedByLoja(Object.values(map))
        } catch(e){}
      } catch(e){}
    }catch(e){ console.error(e) } finally{ setLoading(false) }
  } load() }, [])

  if(loading) return <div>Carregando relatórios...</div>
  if(accessDenied) return <div>Acesso restrito: somente administradores</div>
  if(!summary) return <div>Nenhum dado</div>

  function exportCSVFor(data, filename){
    const rows = []
    if(!data || !data.length) return
    rows.push(['Key','ValorTotal','Quantidade'])
    data.forEach(r=> rows.push([r.loja || r.distribuidora || '—', (r.totalValue||0).toFixed(2), r.count]))
    const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }

  async function applyFilters(){
    setLoading(true)
    try{
      const params = {}
      if(startDate) params.startDate = startDate
      if(endDate) params.endDate = endDate
      if(filterLoja) params.loja = filterLoja
      if(filterDist) params.distribuidora = filterDist
      const s = await fetchReportSummary(params)
      setSummary(s)
      // also fetch raw returns to compute grouped view
      try{
        const raw = await fetchReturns(params)
        const map = {}
        ;(raw||[]).forEach(it=>{
          const loja = it.loja || '—'
          const dist = it.distribuidora || '—'
          const v = Number(it.nfdValue) || 0
          if(!map[loja]) map[loja] = { loja, totalValue: 0, count: 0, distribuidoras: {} }
          map[loja].totalValue += v
          map[loja].count += 1
          if(!map[loja].distribuidoras[dist]) map[loja].distribuidoras[dist] = { distribuidora: dist, totalValue: 0, count: 0 }
          map[loja].distribuidoras[dist].totalValue += v
          map[loja].distribuidoras[dist].count += 1
        })
        setGroupedByLoja(Object.values(map))
      } catch(e){}
    }catch(e){ console.error(e) } finally{ setLoading(false) }
  }

  function clearFilters(){
    setStartDate(''); setEndDate(''); setFilterLoja(''); setFilterDist(''); applyFilters()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Relatórios</h2>
      <div className="flex gap-3">
        <button onClick={()=>window.print()} className="px-3 py-1 bg-primary text-white rounded">Exportar PDF (imprimir)</button>
        <button onClick={()=>exportCSVFor(summary.byLoja, 'report_loja.csv')} className="px-3 py-1 bg-slate-700 text-white rounded">Exportar CSV por loja</button>
        <button onClick={()=>exportCSVFor(summary.byDistribuidora, 'report_distribuidora.csv')} className="px-3 py-1 bg-slate-700 text-white rounded">Exportar CSV por distribuidora</button>
      </div>

      <div className="mt-4">
        <div className="bg-white p-3 rounded shadow-sm mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm block">Início</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
          </div>
          <div>
            <label className="text-sm block">Fim</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
          </div>
          <div>
            <label className="text-sm block">Loja</label>
            <select value={filterLoja} onChange={e=>setFilterLoja(e.target.value)} className="border px-2 py-1 rounded">
              <option value="">Todas</option>
              {lojasOptions.map(l=> <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block">Distribuidora</label>
            <select value={filterDist} onChange={e=>setFilterDist(e.target.value)} className="border px-2 py-1 rounded">
              <option value="">Todas</option>
              {distOptions.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={applyFilters} className="px-3 py-1 bg-primary text-white rounded">Aplicar filtros</button>
            <button onClick={clearFilters} className="px-3 py-1 border rounded">Limpar</button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setView('both')} className={`px-3 py-1 rounded ${view==='both'? 'bg-primary text-white':'bg-slate-100'}`}>Ambos</button>
          <button onClick={()=>setView('loja')} className={`px-3 py-1 rounded ${view==='loja'? 'bg-primary text-white':'bg-slate-100'}`}>Por Loja</button>
          <button onClick={()=>setView('dist')} className={`px-3 py-1 rounded ${view==='dist'? 'bg-primary text-white':'bg-slate-100'}`}>Por Distribuidora</button>
          <button onClick={()=>setView('grouped')} className={`px-3 py-1 rounded ${view==='grouped'? 'bg-primary text-white':'bg-slate-100'}`}>Detalhado por Loja</button>
        </div>
      </div>

      { (view === 'both' || view === 'loja') && (
        <Card>
          <h3 className="font-medium mb-2">Por Loja</h3>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600"><tr><th className="pb-2">Loja</th><th className="pb-2">Valor (R$)</th><th className="pb-2">Registros</th></tr></thead>
              <tbody>
                {summary.byLoja.map(r=> (
                  <tr key={r.loja}><td className="py-1">{r.loja}</td><td className="py-1">R$ {Number(r.totalValue).toFixed(2)}</td><td className="py-1">{r.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      { view === 'grouped' && (
        <Card>
          <h3 className="font-medium mb-2">Detalhado por Loja → Distribuidora</h3>
          <div className="space-y-4">
            {groupedByLoja.map(l=> (
              <div key={l.loja} className="p-3 border rounded">
                <div className="font-semibold">{l.loja} — R$ {Number(l.totalValue).toFixed(2)} • {l.count} registros</div>
                <div className="mt-2 pl-4">
                  {Object.values(l.distribuidoras).map(d=> (
                    <div key={d.distribuidora} className="flex justify-between text-sm py-1"><div>{d.distribuidora}</div><div>R$ {Number(d.totalValue).toFixed(2)} • {d.count}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      { (view === 'both' || view === 'dist') && (
        <Card>
          <h3 className="font-medium mb-2">Por Distribuidora</h3>
          <div className="space-y-2">
            {summary.byDistribuidora.map(d=> (
              <div key={d.distribuidora} className="flex justify-between text-sm"><div>{d.distribuidora}</div><div>R$ {Number(d.totalValue).toFixed(2)} • {d.count}</div></div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-medium mb-2">Resumo Geral</h3>
        <div>Total registros: <strong>{summary.total.totalCount}</strong></div>
        <div>Valor total: <strong>R$ {Number(summary.total.totalValue || 0).toFixed(2)}</strong></div>
      </Card>
    </div>
  )
}
