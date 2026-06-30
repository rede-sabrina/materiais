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
      // load store list from users (order.loja also works but users guarantee list)
      const users = await fetchUsers()
      const storeNames = users.map(u=>u.loja || u.username).filter(Boolean).sort()
      setStores(storeNames)

      // determine earliest order date (fallback to today if none)
      const dates = allOrders.map(o=> new Date(o.createdAt||o.data))
      const minDate = dates.length ? new Date(Math.min.apply(null, dates)) : new Date()
      const today = new Date()
      const fmt = d=> d.toISOString().slice(0,10)
      setStartDate(fmt(minDate))
      setEndDate(fmt(today))
      // generate initial report with full range
      generateReport(fmt(minDate), fmt(today), allOrders, storeNames)
    }catch(e){ console.error(e) }
    setLoading(false)
  } init() }, [])

  // ---------------------------------------------------------------
  // Helper: inclusive date filter (00:00:00 – 23:59:59.999)
  // ---------------------------------------------------------------
  function dateInRange(orderDate){
    const od = orderDate.slice(0,10) // YYYY‑MM‑DD
    if(startDate && od < startDate) return false
    if(endDate && od > endDate) return false
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
    if(s && e && s > e){ alert('Data início não pode ser maior que data fim'); return }
    // filter orders
    const filtered = ords.filter(o=> dateInRange(new Date(o.createdAt||o.data).toISOString()))
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
  // UI Handlers
  // ---------------------------------------------------------------
  async function handleGenerate(){
    setLoading(true)
    await generateReport()
    setLoading(false)
  }

  if(loading) return <div>Carregando...</div>
  if(accessDenied) return <div>Acesso restrito: somente administradores</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Relatórios de Pedidos</h2>
      <div className="flex gap-3 mb-4">
        <button onClick={handleGenerate} className="px-3 py-1 bg-primary text-white rounded">Gerar Relatório</button>
        <button onClick={()=>window.print()} className="px-3 py-1 bg-slate-700 text-white rounded">Imprimir PDF</button>
      </div>
      <div className="flex gap-4">
        <div>
          <label className="block text-sm">Início</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-sm">Fim</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
      </div>
      {report && (
        <div className="space-y-6 mt-6">
          {/* Relatório 1 – Total de materiais */}
          <Card>
            <h3 className="font-medium mb-2">Total Geral de Materiais</h3>
            <div className="overflow-auto"><table className="w-full text-sm">
              <thead className="bg-gray-100"><tr><th className="p-2 text-left">Material</th><th className="p-2 text-right">Quantidade</th></tr></thead>
              <tbody>
                {report.materialTotals.map(r=> (
                  <tr key={r.nome} className="border-t">
                    <td className="p-2">{r.nome}</td>
                    <td className="p-2 text-right font-medium text-blue-700">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
          {/* Relatório 2 – Quantidade por loja */}
          <Card>
            <h3 className="font-medium mb-2">Quantidade por Loja</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Material</th>
                    {stores.map(s=><th key={s} className="p-2 text-right">{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.materialTotals.map(m=> (
                    <tr key={m.nome} className="border-t">
                      <td className="p-2">{m.nome}</td>
                      {stores.map(s=>{
                        const loja = report.storeTotals.find(st=>st.loja===s)
                        const qty = loja?.materiais.find(mat=>mat.material===m.nome)?.quantidade||0
                        return <td key={s} className="p-2 text-right">{qty}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {/* Extras */}
          <Card>
            <h3 className="font-medium mb-2">Resumo</h3>
            <div>Total de pedidos: <strong>{report.totalOrders}</strong></div>
            <div>Materiais diferentes: <strong>{report.distinctMaterials}</strong></div>
            <div>Itens solicitados: <strong>{report.totalItens}</strong></div>
          </Card>
        </div>
      )}
    </div>
  )
}
