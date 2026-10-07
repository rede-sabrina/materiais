import React, { useEffect, useState } from 'react'
import { fetchFernandoOrders } from '../services/api'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

function getDefaultPeriod() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  }
}

export default function FernandoReport() {
  const period = getDefaultPeriod()
  const [startDate, setStartDate] = useState(period.start)
  const [endDate, setEndDate] = useState(period.end)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      } finally {
        setLoading(false)
      }
    }
    if (!startDate || !endDate || startDate <= endDate) load()
  }, [startDate, endDate])

  const materialMap = {}
  const statusMap = {}
  orders.forEach(order => {
    statusMap[order.status] = (statusMap[order.status] || 0) + 1
    ;(order.itens || []).forEach(item => {
      const name = item.produto || 'Outro'
      materialMap[name] = (materialMap[name] || 0) + (Number(item.quantidade) || 0)
    })
  })

  const materials = Object.entries(materialMap)
    .map(([produto, quantidade]) => ({ produto, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.produto.localeCompare(b.produto))
  const totalItems = materials.reduce((sum, item) => sum + item.quantidade, 0)
  const invalidPeriod = startDate && endDate && startDate > endDate

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Relatorio Fernando</h2>
          <p className="text-sm text-gray-500 mt-1">Resumo das solicitacoes no periodo selecionado</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-3 py-2 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-3 py-2 rounded-lg text-sm" />
          </div>
          <button type="button" onClick={() => { setStartDate(''); setEndDate('') }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
            Limpar
          </button>
        </div>
      </div>

      {invalidPeriod && <div className="p-3 rounded-lg bg-red-50 text-red-700">A data inicial nao pode ser maior que a data final.</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Pedidos" value={orders.length} />
        <SummaryCard label="Itens solicitados" value={totalItems} />
        <SummaryCard label="Materiais" value={materials.length} />
        <SummaryCard label="Pendentes" value={statusMap.Pendente || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Materiais solicitados</h3>
            <span className="text-xs text-gray-500">{startDate || 'todo periodo'} a {endDate || 'hoje'}</span>
          </div>
          {loading ? <p className="text-gray-400">Carregando...</p> : materials.length === 0 ? <p className="text-gray-400">Nenhum material no periodo.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-xs text-slate-500 uppercase border-b"><th className="p-3">Material</th><th className="p-3 text-right">Quantidade</th></tr></thead>
                <tbody>{materials.map(item => <tr key={item.produto} className="border-b last:border-0"><td className="p-3">{item.produto}</td><td className="p-3 text-right font-semibold">{item.quantidade}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Pedidos por status</h3>
          <div className="space-y-3">
            {['Pendente', 'Em andamento', 'Atendido', 'Cancelado'].map(status => (
              <div key={status} className="flex items-center justify-between border-b last:border-0 pb-2">
                <span>{status}</span><strong>{statusMap[status] || 0}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Pedidos do periodo</h3>
        {loading ? <p className="text-gray-400">Carregando...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-xs text-slate-500 uppercase border-b"><th className="p-3">Pedido</th><th className="p-3">Loja</th><th className="p-3">Data</th><th className="p-3">Status</th></tr></thead>
              <tbody>{orders.map(order => <tr key={order._id || order.numero} className="border-b last:border-0"><td className="p-3 font-mono text-sm">{order.numero}</td><td className="p-3">{order.loja}</td><td className="p-3">{formatDate(order.createdAt)}</td><td className="p-3">{order.status}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return <div className="bg-white rounded-xl shadow p-5"><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-bold text-primary mt-2">{value}</p></div>
}
