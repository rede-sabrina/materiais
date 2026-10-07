import React, { useEffect, useState } from 'react'
import { fetchFernandoOrders } from '../services/api'

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
  orders.forEach(order => {
    status[order.status] = (status[order.status] || 0) + 1
    ;(order.itens || []).forEach(item => {
      const name = item.produto || 'Outro'
      materials[name] = (materials[name] || 0) + (Number(item.quantidade) || 0)
    })
  })
  const materialList = Object.entries(materials).map(([produto, quantidade]) => ({ produto, quantidade })).sort((a, b) => b.quantidade - a.quantidade || a.produto.localeCompare(b.produto))
  return { materials: materialList, status, totalItems: materialList.reduce((sum, item) => sum + item.quantidade, 0) }
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
        <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Imprimir / PDF</button>
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
      {activeTab === 'summary' && <SummaryView orders={orders} summary={summary} />}
      {activeTab === 'stores' && <StoresView stores={visibleStores} allStores={groupedStores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} />}
    </>}
  </div>
}

function DateField({ label, value, onChange }) { return <div><label className="text-xs font-medium text-gray-600 block mb-1">{label}</label><input type="date" value={value} onChange={e => onChange(e.target.value)} className="border px-3 py-2 rounded-lg text-sm" /></div> }

function SummaryView({ orders, summary }) { return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <section className="bg-white rounded-xl shadow p-5 lg:col-span-2 report-block"><h3 className="font-semibold mb-4">Materiais solicitados</h3><MaterialTable materials={summary.materials} /></section>
  <section className="bg-white rounded-xl shadow p-5 report-block"><h3 className="font-semibold mb-4">Pedidos por status</h3>{STATUSES.map(status => <div key={status} className="flex justify-between border-b last:border-0 py-2"><span>{status}</span><strong>{summary.status[status] || 0}</strong></div>)}</section>
  <section className="bg-white rounded-xl shadow p-5 lg:col-span-3 report-block"><h3 className="font-semibold mb-4">Pedidos detalhados</h3><OrderTable orders={orders} showStore /></section>
</div> }

function StoresView({ stores, allStores, selectedStore, setSelectedStore }) { return <div className="space-y-6">
  <div className="flex flex-wrap justify-between items-center gap-3 print:hidden"><div><h3 className="font-semibold">Relatorio por loja</h3><p className="text-sm text-gray-500">Materiais e pedidos agrupados por loja.</p></div><select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border px-3 py-2 rounded-lg text-sm"><option value="all">Todas as lojas</option>{allStores.map(store => <option key={store.loja} value={store.loja}>{store.loja}</option>)}</select></div>
  {stores.length === 0 ? <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">Nenhum pedido no periodo.</div> : stores.map(store => <section key={store.loja} className="bg-white rounded-xl shadow p-5 report-block"><div className="flex flex-wrap justify-between gap-3 mb-4"><div><h3 className="text-lg font-semibold">{store.loja}</h3><p className="text-sm text-gray-500">{store.orders.length} pedido(s) no periodo</p></div><div className="text-sm text-gray-600">{store.totalItems} item(ns) em {store.materials.length} material(is)</div></div><MaterialTable materials={store.materials} /><h4 className="font-semibold mt-6 mb-3">Pedidos da loja</h4><OrderTable orders={store.orders} /></section>)}
</div> }

function MaterialTable({ materials }) { if (!materials.length) return <p className="text-gray-400">Nenhum material no periodo.</p>; return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-slate-500 uppercase border-b"><th className="p-3">Material</th><th className="p-3 text-right">Quantidade</th></tr></thead><tbody>{materials.map(item => <tr key={item.produto} className="border-b last:border-0"><td className="p-3">{item.produto}</td><td className="p-3 text-right font-semibold">{item.quantidade}</td></tr>)}</tbody></table></div> }

function OrderTable({ orders, showStore = false }) { if (!orders.length) return <p className="text-gray-400">Nenhum pedido no periodo.</p>; return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-slate-500 uppercase border-b"><th className="p-3">Pedido</th>{showStore && <th className="p-3">Loja</th>}<th className="p-3">Data</th><th className="p-3">Solicitante</th><th className="p-3">Itens</th><th className="p-3">Status</th></tr></thead><tbody>{orders.map(order => <tr key={order._id || order.numero} className="border-b last:border-0 align-top"><td className="p-3 font-mono text-sm">{order.numero}</td>{showStore && <td className="p-3">{order.loja || '-'}</td>}<td className="p-3">{formatDate(order.createdAt)}</td><td className="p-3">{order.solicitante || '-'}</td><td className="p-3 min-w-[220px]">{(order.itens || []).map((item, index) => <div key={index}>{item.quantidade}x {item.produto}{item.tamanho ? ` - ${item.tamanho}` : ''}{item.cor ? ` - ${item.cor}` : ''}{item.modelo ? ` - ${item.modelo}` : ''}{item.degraus ? ` - ${item.degraus}` : ''}{item.descricaoOutros ? ` - ${item.descricaoOutros}` : ''}</div>)}</td><td className="p-3">{order.status}</td></tr>)}</tbody></table></div> }

function SummaryCard({ label, value }) { return <div className="bg-white rounded-xl shadow p-4 report-block"><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-bold text-primary mt-2">{value}</p></div> }
