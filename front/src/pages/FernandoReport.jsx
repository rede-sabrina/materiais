import React, { useEffect, useState } from 'react'
import { fetchFernandoOrders } from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUSES = ['Pendente', 'Em andamento', 'Atendido', 'Cancelado']

function formatDate(value) { return value ? new Date(value).toLocaleDateString('pt-BR') : '-' }

function getPeriod() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function summarize(orders) {
  const materials = {}
  const status = {}
  const variations = []
  orders.forEach(order => {
    status[order.status] = (status[order.status] || 0) + 1
    ;(order.itens || []).forEach(item => {
      const name = item.produto || 'Outro'
      materials[name] = (materials[name] || 0) + (Number(item.quantidade) || 0)
      const details = getVariationText(item)
      if (details) variations.push({ loja: order.loja || 'Sem loja', produto: name, quantidade: Number(item.quantidade) || 0, detalhes: details })
    })
  })
  const materialList = Object.entries(materials).map(([produto, quantidade]) => ({ produto, quantidade })).sort((a, b) => b.quantidade - a.quantidade || a.produto.localeCompare(b.produto))
  return { materials: materialList, status, variations, totalItems: materialList.reduce((sum, item) => sum + item.quantidade, 0) }
}

function getVariationText(item) {
  return [
    item.tamanho && `Tamanho: ${item.tamanho}`,
    item.degraus && `Degraus: ${item.degraus}`,
    item.cor && `Cor: ${item.cor}`,
    item.modelo && `Modelo: ${item.modelo}`,
    item.descricaoOutros && `Descricao: ${item.descricaoOutros}`
  ].filter(Boolean).join(' | ')
}

export default function FernandoReport() {
  const period = getPeriod()
  const [startDate, setStartDate] = useState(period.start)
  const [endDate, setEndDate] = useState(period.end)
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('summary')
  const [selectedStore, setSelectedStore] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const invalidPeriod = startDate && endDate && startDate > endDate

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchFernandoOrders({ startDate, endDate })
        setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setError('Nao foi possivel carregar o relatorio.')
      } finally { setLoading(false) }
    }
    if (!invalidPeriod) load()
  }, [startDate, endDate, invalidPeriod])

  const stores = [...new Set(orders.map(order => order.loja || 'Sem loja'))].sort()
  const groupedStores = stores.map(loja => {
    const storeOrders = orders.filter(order => (order.loja || 'Sem loja') === loja)
    return { loja, orders: storeOrders, ...summarize(storeOrders) }
  })
  const summary = summarize(orders)
  const visibleStores = selectedStore === 'all' ? groupedStores : groupedStores.filter(store => store.loja === selectedStore)

  return <div className="space-y-6 report-page">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-2xl font-bold text-gray-800">Relatorio Fernando</h2><p className="text-sm text-gray-500 mt-1">Analise completa de pedidos, lojas e materiais.</p></div>
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <DateField label="Inicio" value={startDate} onChange={setStartDate} />
        <DateField label="Fim" value={endDate} onChange={setEndDate} />
        <button type="button" onClick={() => { setStartDate(''); setEndDate('') }} className="px-3 py-2 border rounded-lg text-sm">Limpar</button>
        <button type="button" onClick={() => generateFernandoPdf({ orders, groupedStores, summary, startDate, endDate, activeTab, selectedStore })} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Baixar PDF</button>
      </div>
    </header>
    <div className="hidden print:block text-sm text-gray-500">Periodo: {startDate || 'inicio'} a {endDate || 'hoje'}</div>
    {invalidPeriod && <div className="p-3 rounded-lg bg-red-50 text-red-700 print:hidden">A data inicial nao pode ser maior que a data final.</div>}
    {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 print:hidden">{error}</div>}
    <div className="flex gap-2 border-b print:hidden">
      <button type="button" onClick={() => setActiveTab('summary')} className={`px-4 py-3 border-b-2 text-sm ${activeTab === 'summary' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500'}`}>Resumo geral</button>
      <button type="button" onClick={() => setActiveTab('stores')} className={`px-4 py-3 border-b-2 text-sm ${activeTab === 'stores' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500'}`}>Separado por loja</button>
    </div>
    {loading ? <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">Carregando relatorio...</div> : <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard label="Pedidos" value={orders.length} /><SummaryCard label="Itens" value={summary.totalItems} /><SummaryCard label="Materiais" value={summary.materials.length} /><SummaryCard label="Lojas" value={stores.length} /><SummaryCard label="Pendentes" value={summary.status.Pendente || 0} />
      </div>
      {activeTab === 'summary' && <SummaryView summary={summary} />}
      {activeTab === 'stores' && <StoresView stores={visibleStores} allStores={groupedStores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} />}
    </>}
  </div>
}

function DateField({ label, value, onChange }) { return <div><label className="text-xs font-medium text-gray-600 block mb-1">{label}</label><input type="date" value={value} onChange={e => onChange(e.target.value)} className="border px-3 py-2 rounded-lg text-sm" /></div> }

function SummaryView({ summary }) { return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <section className="bg-white rounded-xl shadow p-5 lg:col-span-2 report-block"><h3 className="font-semibold mb-4">Materiais solicitados</h3><MaterialTable materials={summary.materials} /></section>
  <section className="bg-white rounded-xl shadow p-5 report-block"><h3 className="font-semibold mb-4">Pedidos por status</h3>{STATUSES.map(status => <div key={status} className="flex justify-between border-b last:border-0 py-2"><span>{status}</span><strong>{summary.status[status] || 0}</strong></div>)}</section>
  {summary.variations.length > 0 && <section className="bg-white rounded-xl shadow p-5 lg:col-span-3 report-block"><h3 className="font-semibold mb-4">Itens com variações</h3><VariationTable variations={summary.variations} /></section>}
</div> }

function StoresView({ stores, allStores, selectedStore, setSelectedStore }) { return <div className="space-y-6">
  <div className="flex flex-wrap justify-between items-center gap-3 print:hidden"><div><h3 className="font-semibold">Relatorio por loja</h3><p className="text-sm text-gray-500">Materiais e pedidos agrupados por loja.</p></div><select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border px-3 py-2 rounded-lg text-sm"><option value="all">Todas as lojas</option>{allStores.map(store => <option key={store.loja} value={store.loja}>{store.loja}</option>)}</select></div>
  {stores.length === 0 ? <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">Nenhum pedido no periodo.</div> : stores.map(store => <section key={store.loja} className="bg-white rounded-xl shadow p-5 report-block"><div className="flex flex-wrap justify-between gap-3 mb-4"><div><h3 className="text-lg font-semibold">{store.loja}</h3><p className="text-sm text-gray-500">{store.orders.length} pedido(s) no periodo</p></div><div className="text-sm text-gray-600">{store.totalItems} item(ns) em {store.materials.length} material(is)</div></div><MaterialTable materials={store.materials} />{store.variations.length > 0 && <><h4 className="font-semibold mt-6 mb-3">Itens com variações</h4><VariationTable variations={store.variations} /></>}</section>)}
</div> }

function MaterialTable({ materials }) { if (!materials.length) return <p className="text-gray-400">Nenhum material no periodo.</p>; return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-slate-500 uppercase border-b"><th className="p-3">Material</th><th className="p-3 text-right">Quantidade</th></tr></thead><tbody>{materials.map(item => <tr key={item.produto} className="border-b last:border-0"><td className="p-3">{item.produto}</td><td className="p-3 text-right font-semibold">{item.quantidade}</td></tr>)}</tbody></table></div> }

function VariationTable({ variations }) { return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-slate-500 uppercase border-b"><th className="p-3">Loja</th><th className="p-3">Material</th><th className="p-3">Qtd.</th><th className="p-3">Detalhes</th></tr></thead><tbody>{variations.map((item, index) => <tr key={`${item.loja}-${item.produto}-${index}`} className="border-b last:border-0"><td className="p-3">{item.loja}</td><td className="p-3">{item.produto}</td><td className="p-3">{item.quantidade}</td><td className="p-3">{item.detalhes}</td></tr>)}</tbody></table></div> }

function SummaryCard({ label, value }) { return <div className="bg-white rounded-xl shadow p-4 report-block"><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-bold text-primary mt-2">{value}</p></div> }

function generateFernandoPdf({ orders, groupedStores, summary, startDate, endDate, activeTab, selectedStore }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 36
  const pageWidth = doc.internal.pageSize.getWidth()
  const title = activeTab === 'stores' ? 'Relatorio por Loja - Fernando' : 'Relatorio Fernando'
  const period = `${startDate || 'inicio'} a ${endDate || 'hoje'}`
  doc.setFillColor(25, 65, 115)
  doc.rect(0, 0, pageWidth, 72, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(title, margin, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Periodo: ${period}`, margin, 53)
  doc.setTextColor(40, 40, 40)
  let y = 96
  const selectedStores = selectedStore === 'all' ? groupedStores : groupedStores.filter(store => store.loja === selectedStore)
  const cards = activeTab === 'stores' ? [
    ['Lojas', selectedStores.length],
    ['Pedidos', selectedStores.reduce((sum, store) => sum + store.orders.length, 0)],
    ['Itens', selectedStores.reduce((sum, store) => sum + store.totalItems, 0)]
  ] : [['Pedidos', orders.length], ['Itens', summary.totalItems], ['Materiais', summary.materials.length], ['Lojas', groupedStores.length]]
  const cardWidth = (pageWidth - margin * 2 - 18 * (cards.length - 1)) / cards.length
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 18)
    doc.setFillColor(240, 245, 250)
    doc.roundedRect(x, y, cardWidth, 42, 5, 5, 'F')
    doc.setFontSize(9)
    doc.setTextColor(90, 100, 110)
    doc.text(card[0], x + 10, y + 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(25, 65, 115)
    doc.text(String(card[1]), x + 10, y + 34)
    doc.setFont('helvetica', 'normal')
  })
  y += 62
  if (activeTab === 'summary') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(40, 40, 40)
    doc.text('Materiais solicitados', margin, y)
    autoTable(doc, { startY: y + 8, head: [['Material', 'Quantidade']], body: summary.materials.map(item => [item.produto, item.quantidade]), margin: { left: margin, right: margin }, headStyles: { fillColor: [25, 65, 115] }, styles: { fontSize: 9 } })
    y = doc.lastAutoTable.finalY + 22
    addVariationsPdf(doc, summary.variations, margin, y)
  } else {
    selectedStores.forEach(store => {
      if (y > 690) { doc.addPage(); y = 42 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(25, 65, 115)
      doc.text(store.loja, margin, y)
      autoTable(doc, { startY: y + 8, head: [['Material', 'Quantidade']], body: store.materials.map(item => [item.produto, item.quantidade]), margin: { left: margin, right: margin }, headStyles: { fillColor: [25, 65, 115] }, styles: { fontSize: 9 } })
      y = doc.lastAutoTable.finalY + 16
      y = addVariationsPdf(doc, store.variations, margin, y)
    })
  }
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) { doc.setPage(page); doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} | Pagina ${page}/${pages}`, margin, 810) }
  doc.save(`relatorio-fernando-${startDate || 'periodo'}-${endDate || 'atual'}.pdf`)
}

function addVariationsPdf(doc, variations, margin, y) {
  if (!variations.length) return y
  if (y > 700) { doc.addPage(); y = 42 }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text('Itens com variacoes', margin, y)
  autoTable(doc, { startY: y + 8, head: [['Loja', 'Material', 'Qtd.', 'Detalhes']], body: variations.map(item => [item.loja, item.produto, item.quantidade, item.detalhes]), margin: { left: margin, right: margin }, headStyles: { fillColor: [90, 115, 140] }, styles: { fontSize: 8, cellPadding: 4 } })
  return doc.lastAutoTable.finalY + 20
}
