import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import { fetchMe, fetchOrders, fetchUsers } from '../services/api'

export default function Reports(){
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stores, setStores] = useState([])
  const [report, setReport] = useState(null)

  // verify admin and load store list
  useEffect(()=>{ async function init(){
    try{
      const me = await fetchMe()
      if(!me || me.role !== 'ADMIN'){
        setAccessDenied(true)
        setLoading(false)
        return
      }
      const users = await fetchUsers()
      const lojas = users.map(u=>u.loja || u.username).filter(Boolean)
      setStores(lojas)
    }catch(e){ console.error(e) }
    setLoading(false)
  } init() }, [])

  // inclusive date filter (00:00:00 - 23:59:59.999)
  function applyDateFilter(order){
    const date = new Date(order.createdAt || order.data)
    if(startDate){
      const start = new Date(startDate)
      start.setHours(0,0,0,0)
      if(date < start) return false
    }
    if(endDate){
      const end = new Date(endDate)
      end.setHours(23,59,59,999)
      if(date > end) return false
    }
    return true
  }

  async function generateReport(){
    setLoading(true)
    try{
      const all = await fetchOrders()
      const filtered = all.filter(applyDateFilter)
      // Material totals
      const materialMap = {}
      // Store -> material -> qty
      const storeMap = {}
      filtered.forEach(o=>{
        const store = o.loja || ''
        if(!storeMap[store]) storeMap[store] = {}
        ;(o.itens||[]).forEach(it=>{
          const nome = it.nome || ''
          const qty = Number(it.quantidade) || 0
          materialMap[nome] = (materialMap[nome]||0) + qty
          storeMap[store][nome] = (storeMap[store][nome]||0) + qty
        })
      })
      const materialTotals = Object.entries(materialMap).map(([nome,total])=>({nome,total})).sort((a,b)=>a.nome.localeCompare(b.nome))
      const storeTotals = stores.map(loja=>({
        loja,
        materiais: materialTotals.map(m=>({ material: m.nome, quantidade: storeMap[loja]?.[m.nome]||0 }))
      }))
      const totalOrders = filtered.length
      const distinctMaterials = Object.keys(materialMap).length
      const totalItens = Object.values(materialMap).reduce((a,b)=>a+b,0)
      setReport({materialTotals, storeTotals, totalOrders, distinctMaterials, totalItens})
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  if(loading) return <div>Carregando...</div>
  if(accessDenied) return <div>Acesso restrito: somente administradores</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Relatórios de Pedidos</h2>
      <div className="flex gap-3 mb-4">
        <button onClick={generateReport} className="px-3 py-1 bg-primary text-white rounded">Gerar Relatório</button>
        <button onClick={()=>window.print()} className="px-3 py-1 bg-slate-700 text-white rounded">Imprimir PDF</button>
      </div>
      <div className="flex gap-3">
        <div>
          <label className="text-sm block">Início</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="text-sm block">Fim</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
      </div>
      {report && (
        <div className="space-y-6 mt-6">
          {/* Relatório 1 – Total Geral de Materiais */}
          <Card>
            <h3 className="font-medium mb-2">Total Geral de Materiais</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">Material</th><th className="p-2 text-right">Quantidade</th></tr></thead>
                <tbody>
                  {report.materialTotals.map(r=> (
                    <tr key={r.nome} className="border-t">
                      <td className="p-2">{r.nome}</td>
                      <td className="p-2 text-right font-medium text-blue-700">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {/* Relatório 2 – Quantidade por Loja */}
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
