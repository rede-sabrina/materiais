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
  const [selectedStore, setSelectedStore] = useState('all') // 'all' ou nome da loja específica

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
  // Generate report for specific store (or all stores)
  // ---------------------------------------------------------------
  function getStoreReport(storeName){
    if(!report) return null
    
    // Se não houver loja selecionada ou for 'all', retorna todas
    if(!storeName || storeName === 'all'){
      return report.storeTotals
        .filter(s=> s.materiais.some(m=>m.quantidade>0))
        .map(s=>{
          const totalItems = s.materiais.reduce((a,b)=>a+(b.quantidade||0),0)
          const storeOrders = orders.filter(o=>{
            const inDateRange = dateInRange(new Date(o.createdAt||o.data).toISOString(), startDate, endDate)
            return inDateRange && (o.loja === s.loja)
          }).length
          return {
            loja: s.loja,
            materiais: s.materiais.filter(m=>m.quantidade>0),
            totalItems,
            totalOrders: storeOrders
          }
        })
    }
    
    // Retorna apenas a loja selecionada
    const storeData = report.storeTotals.find(s=>s.loja===storeName)
    if(!storeData) return null
    const totalItems = storeData.materiais.reduce((a,b)=>a+(b.quantidade||0),0)
    const storeOrders = orders.filter(o=>{
      const inDateRange = dateInRange(new Date(o.createdAt||o.data).toISOString(), startDate, endDate)
      return inDateRange && (o.loja === storeName)
    }).length
    return [{
      loja: storeName,
      materiais: storeData.materiais.filter(m=>m.quantidade>0),
      totalItems,
      totalOrders: storeOrders
    }]
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

  function handlePrint(){
    if(!report) return
    
    const html = `
      <html>
        <head>
          <title>Relatório de Pedidos - ${startDate} até ${endDate}</title>
          <style>
            @page { 
              size: A4 landscape; 
              margin: 1.2cm; 
              @page:first { margin-top: 1.5cm; }
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              padding: 0; 
              margin: 0; 
              background: #fff;
              color: #333;
              font-size: 13px;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 3px solid #667eea;
            }
            .header h1 {
              color: #667eea;
              font-size: 22px;
              margin: 0 0 8px 0;
              font-weight: bold;
            }
            .period {
              color: #666;
              font-size: 13px;
              margin: 0;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              padding: 10px 18px;
              font-size: 15px;
              font-weight: bold;
              border-radius: 6px;
              margin-bottom: 12px;
              box-shadow: 0 2px 8px rgba(102,126,234,0.3);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 15px;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-weight: bold;
              padding: 8px 10px;
              text-align: left;
              border-bottom: 2px solid #9ca3af;
              white-space: nowrap;
              font-size: 12px;
            }
            td {
              padding: 7px 10px;
              border-bottom: 1px solid #e5e7eb;
              color: #1f2937;
              font-size: 12px;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            tr:hover {
              background: #f0f4ff;
            }
            .text-right {
              text-align: right;
            }
            .font-bold {
              font-weight: bold;
            }
            .text-blue {
              color: #4f46e5;
            }
            .summary-box {
              display: inline-block;
              background: #f3f4f6;
              padding: 12px 20px;
              border-radius: 8px;
              margin: 8px;
              text-align: center;
              min-width: 140px;
            }
            .summary-label {
              font-size: 11px;
              color: #666;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 22px;
              font-weight: bold;
              color: #667eea;
            }
            .summary-container {
              text-align: center;
              margin: 15px 0;
            }
            .no-data {
              text-align: center;
              color: #999;
              font-style: italic;
              padding: 25px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório de Pedidos</h1>
            <p class="period">Período: <strong>${new Date(startDate+'T00:00:00').toLocaleDateString('pt-BR')}</strong> até <strong>${new Date(endDate+'T23:59:59').toLocaleDateString('pt-BR')}</strong></p>
          </div>

          <div class="section">
            <div class="section-title">📦 Resumo do Período</div>
            <div class="summary-container">
              <div class="summary-box">
                <div class="summary-label">Total de Pedidos</div>
                <div class="summary-value">${report.totalOrders}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">Materiais Diferentes</div>
                <div class="summary-value">${report.distinctMaterials}</div>
              </div>
              <div class="summary-box">
                <div class="summary-label">Itens Solicitados</div>
                <div class="summary-value">${report.totalItens}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Total Geral de Materiais</div>
            ${report.materialTotals.length > 0 ? `
            <table style="table-layout:fixed;">
              <thead>
                <tr>
                  <th style="width:70%;padding:6px 8px;">Material</th>
                  <th class="text-right" style="width:30%;padding:6px 8px;">Qtd. Total</th>
                </tr>
              </thead>
              <tbody>
                ${report.materialTotals.map(r => `
                  <tr>
                    <td style="padding:5px 8px;overflow:hidden;text-overflow:ellipsis;">${r.nome}</td>
                    <td class="text-right font-bold text-blue" style="padding:5px 8px;">${r.total}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<div class="no-data">Nenhum material no período selecionado</div>'}
          </div>

          <div class="section">
            <div class="section-title">🏪 Distribuição por Loja</div>
            ${report.materialTotals.length > 0 ? `
            <table style="font-size: 11px;">
              <thead>
                <tr>
                  <th style="width: 20%; min-width: 120px;">Material</th>
                  ${stores.map(s => `<th class="text-right" style="min-width: 70px; padding: 8px 6px;">${s.length > 18 ? s.substring(0,18)+'...' : s}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${report.materialTotals.map(m => `
                  <tr>
                    <td style="font-weight: bold; padding: 7px 10px;">${m.nome}</td>
                    ${stores.map(s => {
                      const loja = report.storeTotals.find(st=>st.loja===s)
                      const qty = loja?.materiais.find(mat=>mat.material===m.nome)?.quantidade||0
                      return `<td class="text-right ${qty > 0 ? 'font-bold text-blue' : ''}" style="color: ${qty > 0 ? '#4f46e5' : '#999'}; padding: 7px 6px;">${qty}</td>`
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<div class="no-data">Nenhum dado para exibir</div>'}
          </div>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 10px;">
            Relatório gerado em ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(()=>{ w.print() }, 250)
  }

  // Imprimir relatório da aba "Por Loja"
  function handlePrintByStore(){
    if(!report) return
    
    const storeReports = getStoreReport(selectedStore)
    if(!storeReports || storeReports.length === 0) return
    
    const displayTitle = selectedStore && selectedStore !== 'all' 
      ? `Relatório por Loja - ${selectedStore}`
      : 'Relatório por Loja - Todas as Lojas'
    
    let html = `
      <html>
        <head>
          <title>${displayTitle}</title>
          <style>
            @page { 
              size: A4; 
              margin: 1.5cm; 
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              padding: 0; 
              margin: 0; 
              background: #fff;
              color: #333;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 3px solid #667eea;
            }
            .header h1 {
              color: #667eea;
              font-size: 20px;
              margin: 0 0 8px 0;
              font-weight: bold;
            }
            .period {
              color: #666;
              font-size: 12px;
              margin: 0;
            }
            .store-block {
              page-break-inside: avoid;
              margin-bottom: 30px;
              border: 2px solid #667eea;
              border-radius: 8px;
              overflow: hidden;
            }
            .store-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              padding: 12px 18px;
              font-size: 16px;
              font-weight: bold;
            }
            .store-stats {
              background: #f3f4f6;
              padding: 10px 18px;
              display: flex;
              gap: 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .stat-item {
              font-size: 12px;
            }
            .stat-label {
              color: #666;
              font-size: 11px;
            }
            .stat-value {
              color: #667eea;
              font-weight: bold;
              font-size: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-weight: bold;
              padding: 8px 10px;
              text-align: left;
              border-bottom: 2px solid #9ca3af;
            }
            td {
              padding: 7px 10px;
              border-bottom: 1px solid #e5e7eb;
              color: #1f2937;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .text-right {
              text-align: right;
            }
            .text-blue {
              color: #4f46e5;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #999;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏪 ${displayTitle}</h1>
            <p class="period">Período: <strong>${new Date(startDate+'T00:00:00').toLocaleDateString('pt-BR')}</strong> até <strong>${new Date(endDate+'T23:59:59').toLocaleDateString('pt-BR')}</strong></p>
          </div>
          
          ${storeReports.map(storeReport => `
            <div class="store-block">
              <div class="store-header">
                🏪 ${storeReport.loja}
              </div>
              <div class="store-stats">
                <div class="stat-item">
                  <div class="stat-label">Pedidos no período</div>
                  <div class="stat-value">${storeReport.totalOrders}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Total de itens</div>
                  <div class="stat-value">${storeReport.totalItems}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Materiais diferentes</div>
                  <div class="stat-value">${storeReport.materiais.length}</div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 75%;">Material</th>
                    <th class="text-right" style="width: 25%;">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  ${storeReport.materiais.map(m => `
                    <tr>
                      <td>${m.material}</td>
                      <td class="text-right text-blue">${m.quantidade}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div class="footer">
            Relatório gerado em ${new Date().toLocaleString('pt-BR')} • Total de lojas: ${storeReports.length}
          </div>
        </body>
      </html>
    `
    
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(()=>{ w.print() }, 250)
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
          <button onClick={activeTab==='overview' ? handlePrint : handlePrintByStore} className="px-3 py-1 bg-slate-700 text-white rounded">
            {activeTab==='overview' ? 'Imprimir Visão Geral' : 'Imprimir Por Loja'}
          </button>
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
                    <th className="px-4 py-3 text-left font-semibold">Material</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Qtd. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.materialTotals.map((r, idx)=> (
                    <tr key={r.nome} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.nome}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{r.total}</td>
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
                    <th className="px-4 py-3 text-left font-semibold">Material</th>
                    {stores.map(s=> (
                      <th key={s} className="px-4 py-3 text-right font-semibold w-28 whitespace-nowrap">{s.length > 15 ? s.substring(0,15)+'...' : s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.materialTotals.map((m, idx)=> (
                    <tr key={m.nome} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">{m.nome}</td>
                      {stores.map(s=>{
                        const loja = report.storeTotals.find(st=>st.loja===s)
                        const qty = loja?.materiais.find(mat=>mat.material===m.nome)?.quantidade||0
                        return (
                          <td key={s} className={`px-4 py-3 text-right ${qty > 0 ? 'font-semibold text-blue-700' : 'text-gray-400'}`}>
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
              <label className="text-sm font-medium">Filtrar por loja:</label>
              <select 
                value={selectedStore} 
                onChange={e=>setSelectedStore(e.target.value)}
                className="border px-3 py-2 rounded flex-1 max-w-xs"
              >
                <option value="all">Todas as lojas</option>
                {stores.map(s=> (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {(()=>{
              const storeReports = getStoreReport(selectedStore)
              if(!storeReports || storeReports.length === 0) return <div className="text-gray-500">Nenhuma loja com dados neste período</div>
              
              return (
                <div className="space-y-6">
                  {storeReports.map(storeReport => (
                    <div key={storeReport.loja} className="border rounded-lg p-4 bg-gray-50">
                      <div className="bg-blue-50 p-4 rounded mb-4">
                        <h3 className="text-lg font-semibold text-blue-800">🏪 {storeReport.loja}</h3>
                        <div className="flex gap-6 mt-2 text-sm">
                          <div>Pedidos no período: <strong className="text-blue-700">{storeReport.totalOrders}</strong></div>
                          <div>Total de itens: <strong className="text-blue-700">{storeReport.totalItems}</strong></div>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-2">Materiais solicitados</h4>
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
                  ))}
                </div>
              )
            })()}
          </Card>
        </div>
      )}
    </div>
  )
}
