import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import { fetchMe, fetchOrders, fetchUsers } from '../services/api'

export default function Reports(){
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [orders, setOrders] = useState([])          // all orders fetched
  const [stores, setStores] = useState([])          // store names list
  const [startDate, setStartDate] = useState('')    // YYYY‑MM‑DD
  const [endDate, setEndDate] = useState('')        // YYYY‑MM‑DD
  const [report, setReport] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'byStore'
  const [selectedStore, setSelectedStore] = useState('') // selected store for detail view

  // -----------------------------------------------------------------
  // Load data on mount: verify admin, fetch orders & stores, set defaults
  // -----------------------------------------------------------------
  useEffect(()=>{ async function init(){
    try{
      const me = await fetchMe()
      if(!me || me.role !== 'ADMIN'){
        setAccessDenied(true)
        setLoading(false)
        return
      }
      const allOrders = await fetchOrders()
      setOrders(allOrders)
      // load store list from users, excluding ADMIN users
      const users = await fetchUsers()
      const storeNames = users
        .filter(u=> (u.loja || u.username) && u.role !== 'ADMIN')
        .map(u=>u.loja || u.username)
        .filter(Boolean)
        .sort()
      setStores(storeNames)

      // determine earliest order date (fallback to today if none)
      const dates = allOrders.map(o=> new Date(o.createdAt||o.data))
      const minDate = dates.length ? new Date(Math.min.apply(null, dates)) : new Date()
      const today = new Date()
      const fmt = d=> d.toISOString().slice(0,10)
      const startStr = fmt(minDate)
      const endStr = fmt(today)
      setStartDate(startStr)
      setEndDate(endStr)
      // generate initial report with full range (wait for next render)
      setTimeout(()=> generateReport(startStr, endStr, allOrders, storeNames), 0)
    }catch(e){ console.error(e) }
    setLoading(false)
  } init() }, [])

  // ---------------------------------------------------------------
  // Helper: inclusive date filter (00:00:00 – 23:59:59.999)
  // ---------------------------------------------------------------
  function dateInRange(orderDate, start, end){
    const od = orderDate.slice(0,10) // YYYY‑MM‑DD
    if(start && od < start) return false
    if(end && od > end) return false
    return true
  }

  // ---------------------------------------------------------------
  // Generate report based on current dates and data
  // ---------------------------------------------------------------
  async function generateReport(customStart, customEnd, customOrders, customStores){
    // allow overriding for initial call
    const s = customStart !== undefined ? customStart : startDate
    const e = customEnd !== undefined ? customEnd : endDate
    const ords = customOrders !== undefined ? customOrders : orders
    const stors = customStores !== undefined ? customStores : stores
    
    if(!ords || ords.length === 0){
      setReport({materialTotals:[], storeTotals:[], totalOrders:0, distinctMaterials:0, totalItens:0})
      return
    }
    
    if(s && e && s > e){ alert('Data início não pode ser maior que data fim'); return }
    
    // filter orders
    const filtered = ords.filter(o=> dateInRange(new Date(o.createdAt||o.data).toISOString(), s, e))
    // material totals
    const materialMap = {}
    // store → material → qty
    const storeMap = {}
    filtered.forEach(o=>{
      const loja = o.loja || ''
      if(!storeMap[loja]) storeMap[loja] = {}
      ;(o.itens||[]).forEach(it=>{
        const name = it.nome || ''
        const qty = Number(it.quantidade) || 0
        materialMap[name] = (materialMap[name]||0) + qty
        storeMap[loja][name] = (storeMap[loja][name]||0) + qty
      })
    })
    const materialTotals = Object.entries(materialMap).map(([nome,total])=>({nome,total})).sort((a,b)=>a.nome.localeCompare(b.nome))
    const storeTotals = stors.map(loja=>({
      loja,
      materiais: materialTotals.map(m=>({ material: m.nome, quantidade: storeMap[loja]?.[m.nome]||0 }))
    }))
    const totalOrders = filtered.length
    const distinctMaterials = Object.keys(materialMap).length
    const totalItens = Object.values(materialMap).reduce((a,b)=>a+b,0)
    setReport({materialTotals, storeTotals, totalOrders, distinctMaterials, totalItens})
  }

  // ---------------------------------------------------------------
  // Generate report for specific store
  // ---------------------------------------------------------------
  function getStoreReport(storeName){
    if(!report || !storeName) return null
    const storeData = report.storeTotals.find(s=>s.loja===storeName)
    if(!storeData) return null
    const totalItems = storeData.materiais.reduce((a,b)=>a+(b.quantidade||0),0)
    const storeOrders = orders.filter(o=>{
      const inDateRange = dateInRange(new Date(o.createdAt||o.data).toISOString(), startDate, endDate)
      return inDateRange && (o.loja === storeName)
    }).length
    return {
      loja: storeName,
      materiais: storeData.materiais.filter(m=>m.quantidade>0),
      totalItems,
      totalOrders: storeOrders
    }
  }

  // ---------------------------------------------------------------
  // UI Handlers
  // ---------------------------------------------------------------
  async function handleGenerate(){
    if(startDate && endDate && startDate > endDate){
      alert('Data início não pode ser maior que data fim')
      return
    }
    setLoading(true)
    await generateReport()
    setLoading(false)
  }

  if(loading) return <div>Carregando...</div>
  if(accessDenied) return <div>Acesso restrito: somente administradores</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Relatórios de Pedidos</h2>
      
      {/* Tabs de navegação */}
      <div className="flex gap-2 border-b pb-2">
        <button 
          onClick={()=>setActiveTab('overview')} 
          className={`px-4 py-2 rounded ${activeTab==='overview'? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={()=>setActiveTab('byStore')} 
          className={`px-4 py-2 rounded ${activeTab==='byStore'? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Por Loja
        </button>
      </div>

      {/* Filtros e botões de ação */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-3 flex-1">
          <div>
            <label className="block text-sm">Início</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
          </div>
          <div>
            <label className="block text-sm">Fim</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerate} className="px-3 py-1 bg-primary text-white rounded">Gerar Relatório</button>
          <button onClick={()=>window.print()} className="px-3 py-1 bg-slate-700 text-white rounded">Imprimir PDF</button>
        </div>
      </div>

      {/* Conteúdo das abas */}
      {report && activeTab === 'overview' && (
        <div className="space-y-6 mt-6">
          {/* Relatório 1 – Total de materiais */}
          <Card>
            <h3 className="font-medium mb-3 text-lg">Total Geral de Materiais</h3>
            <div className="overflow-auto max-h-96 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-primary text-white sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-semibold">Material</th>
                    <th className="p-3 text-right font-semibold">Quantidade Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.materialTotals.map((r, idx)=> (
                    <tr key={r.nome} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-800">{r.nome}</td>
                      <td className="p-3 text-right font-bold text-blue-700 text-base">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <strong>Materiais diferentes:</strong> {report.materialTotals.length} • <strong>Total de itens:</strong> {report.totalItens}
            </div>
          </Card>
          {/* Relatório 2 – Quantidade por loja */}
          <Card>
            <h3 className="font-medium mb-3 text-lg">Distribuição de Materiais por Loja</h3>
            <div className="overflow-auto max-h-96 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-primary text-white sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-semibold">Material</th>
                    {stores.map(s=> (
                      <th key={s} className="p-3 text-right font-semibold min-w-[100px]">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.materialTotals.map((m, idx)=> (
                    <tr key={m.nome} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-800">{m.nome}</td>
                      {stores.map(s=>{
                        const loja = report.storeTotals.find(st=>st.loja===s)
                        const qty = loja?.materiais.find(mat=>mat.material===m.nome)?.quantidade||0
                        return (
                          <td key={s} className={`p-3 text-right ${qty > 0 ? 'font-semibold text-blue-700' : 'text-gray-400'}`}>
                            {qty}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <strong>Total de lojas:</strong> {stores.length} • <strong>Materiais:</strong> {report.materialTotals.length}
            </div>
          </Card>
          {/* Extras */}
          <Card>
            <h3 className="font-medium mb-4 text-lg">Resumo do Período</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Total de Pedidos</div>
                <div className="text-3xl font-bold text-primary">{report.totalOrders}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Materiais Diferentes</div>
                <div className="text-3xl font-bold text-green-700">{report.distinctMaterials}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Itens Solicitados</div>
                <div className="text-3xl font-bold text-purple-700">{report.totalItens}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* aba Por Loja */}
      {report && activeTab === 'byStore' && (
        <div className="space-y-6 mt-6">
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">Selecione a loja:</label>
              <select 
                value={selectedStore} 
                onChange={e=>setSelectedStore(e.target.value)}
                className="border px-3 py-2 rounded flex-1 max-w-xs"
              >
                <option value="">Selecione uma loja...</option>
                {stores.map(s=> (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {selectedStore && (()=>{
              const storeReport = getStoreReport(selectedStore)
              if(!storeReport) return <div className="text-gray-500">Nenhum dado para esta loja</div>
              return (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="text-lg font-semibold text-blue-800">{storeReport.loja}</h3>
                    <div className="flex gap-6 mt-2 text-sm">
                      <div>Pedidos no período: <strong className="text-blue-700">{storeReport.totalOrders}</strong></div>
                      <div>Total de itens: <strong className="text-blue-700">{storeReport.totalItems}</strong></div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium">Materiais solicitados</h4>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Material</th>
                          <th className="p-2 text-right">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeReport.materiais.map(m=> (
                          <tr key={m.material} className="border-t">
                            <td className="p-2">{m.material}</td>
                            <td className="p-2 text-right font-medium text-blue-700">{m.quantidade}</td>
                          </tr>
                        ))}
                        {storeReport.materiais.length === 0 && (
                          <tr>
                            <td colSpan={2} className="p-4 text-center text-gray-500">Nenhum material solicitado neste período</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </Card>
        </div>
      )}
    </div>
  )
}
