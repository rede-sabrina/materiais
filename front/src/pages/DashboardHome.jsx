import React, { useEffect, useState } from 'react'
import { fetchOrders, fetchMe, fetchUsers } from '../services/api'

export default function DashboardHome() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [stores, setStores] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Carregar dados iniciais
  useEffect(() => {
    async function init() {
      try {
        const me = await fetchMe()
        if (!me) return
        setIsAdmin(me.role === 'ADMIN')
        
        const allOrders = await fetchOrders()
        setOrders(allOrders)
        
        if (me.role === 'ADMIN') {
          const users = await fetchUsers()
          const storeNames = users
            .filter(u => u.role !== 'ADMIN')
            .map(u => u.loja || u.username)
            .filter(Boolean)
            .sort()
          setStores(storeNames)
        } else {
          setStores([me.loja || me.username])
        }
        
        // Set default date range (last 30 days)
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        setStartDate(thirtyDaysAgo.toISOString().slice(0, 10))
        setEndDate(today.toISOString().slice(0, 10))
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Filtrar pedidos por data
  function filterByDate(ordersList, start, end) {
    if (!start && !end) return ordersList
    return ordersList.filter(o => {
      const orderDate = new Date(o.createdAt || o.data).toISOString().slice(0, 10)
      if (start && orderDate < start) return false
      if (end && orderDate > end) return false
      return true
    })
  }

  // Calcular estatísticas
  function calculateStats() {
    const filtered = filterByDate(orders, startDate, endDate)
    
    // Total de pedidos
    const totalOrders = filtered.length
    
    // Total de itens
    const totalItems = filtered.reduce((sum, o) => 
      sum + (o.itens || []).reduce((s, i) => s + (Number(i.quantidade) || 0), 0), 0
    )
    
    // Materiais diferentes
    const allMaterials = new Set()
    filtered.forEach(o => {
      (o.itens || []).forEach(i => {
        if (i.nome) allMaterials.add(i.nome)
      })
    })
    const distinctMaterials = allMaterials.size
    
    // Pedidos por status
    const statusCount = {}
    filtered.forEach(o => {
      const status = o.status || 'Pendente'
      statusCount[status] = (statusCount[status] || 0) + 1
    })
    
    // Top 5 materiais mais solicitados
    const materialCount = {}
    filtered.forEach(o => {
      (o.itens || []).forEach(i => {
        const nome = i.nome || 'Desconhecido'
        materialCount[nome] = (materialCount[nome] || 0) + (Number(i.quantidade) || 0)
      })
    })
    const topMaterials = Object.entries(materialCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
    
    // Pedidos por loja (apenas admin)
    const ordersByStore = {}
    if (isAdmin) {
      stores.forEach(store => {
        const storeOrders = filtered.filter(o => o.loja === store)
        const storeItems = storeOrders.reduce((sum, o) => 
          sum + (o.itens || []).reduce((s, i) => s + (Number(i.quantidade) || 0), 0), 0
        )
        ordersByStore[store] = {
          pedidos: storeOrders.length,
          itens: storeItems
        }
      })
    }
    
    // Média de itens por pedido
    const avgItemsPerOrder = totalOrders > 0 
      ? (totalItems / totalOrders).toFixed(1) 
      : '0.0'
    
    return {
      totalOrders,
      totalItems,
      distinctMaterials,
      statusCount,
      topMaterials,
      ordersByStore,
      avgItemsPerOrder
    }
  }

  const stats = calculateStats()

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard de Pedidos</h2>
          <p className="text-sm text-gray-500 mt-1">Visão geral da distribuição de materiais</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Início</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Fim</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>

          <button 
            onClick={() => { setStartDate(''); setEndDate('') }} 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Pedidos */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Pedidos</p>
              <p className="text-4xl font-bold mt-2">{stats.totalOrders}</p>
              <p className="text-blue-200 text-xs mt-2">No período selecionado</p>
            </div>
            <div className="text-5xl opacity-30">📦</div>
          </div>
        </div>

        {/* Total de Itens */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total de Itens</p>
              <p className="text-4xl font-bold mt-2">{stats.totalItems}</p>
              <p className="text-green-200 text-xs mt-2">Unidades solicitadas</p>
            </div>
            <div className="text-5xl opacity-30">📋</div>
          </div>
        </div>

        {/* Materiais Diferentes */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Materiais Diferentes</p>
              <p className="text-4xl font-bold mt-2">{stats.distinctMaterials}</p>
              <p className="text-purple-200 text-xs mt-2">Tipos de produtos</p>
            </div>
            <div className="text-5xl opacity-30">🏷️</div>
          </div>
        </div>

        {/* Média de Itens/Pedido */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Média Itens/Pedido</p>
              <p className="text-4xl font-bold mt-2">{stats.avgItemsPerOrder}</p>
              <p className="text-orange-200 text-xs mt-2">Unidades por pedido</p>
            </div>
            <div className="text-5xl opacity-30">📊</div>
          </div>
        </div>
      </div>

      {/* Top Materiais Mais Solicitados */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">🔥 Top 5 Materiais Mais Solicitados</h3>
          <span className="text-sm text-gray-500">No período</span>
        </div>
        <div className="space-y-3">
          {stats.topMaterials.length > 0 ? (
            stats.topMaterials.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' :
                    idx === 1 ? 'bg-gray-400' :
                    idx === 2 ? 'bg-orange-500' :
                    'bg-blue-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-medium text-gray-800">{m.nome}</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{m.quantidade}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">Nenhum material no período selecionado</div>
          )}
        </div>
      </div>

      {/* Pedidos por Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📍 Pedidos por Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {['Pendente', 'Concluído'].map(status => {
            const count = stats.statusCount[status] || 0
            const colors = {
              'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
              'Concluído': 'bg-green-100 text-green-800 border-green-300'
            }
            return (
              <div key={status} className={`p-4 rounded-lg border-2 ${colors[status]}`}>
                <p className="text-sm font-medium opacity-80">{status}</p>
                <p className="text-3xl font-bold mt-1">{count}</p>
              </div>
            )
          })}
          {Object.keys(stats.statusCount).filter(s => !['Pendente', 'Concluído'].includes(s)).map(status => (
            <div key={status} className="p-4 rounded-lg border-2 bg-gray-100 text-gray-800 border-gray-300">
              <p className="text-sm font-medium opacity-80">{status}</p>
              <p className="text-3xl font-bold mt-1">{stats.statusCount[status] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pedidos por Loja (apenas admin) */}
      {isAdmin && stores.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🏪 Pedidos por Loja</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-700">Loja</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Pedidos</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Total de Itens</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Média de Itens</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store, idx) => {
                  const data = stats.ordersByStore[store] || { pedidos: 0, itens: 0 }
                  const avg = data.pedidos > 0 ? (data.itens / data.pedidos).toFixed(1) : '0.0'
                  return (
                    <tr key={store} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-800">{store}</td>
                      <td className="p-3 text-right">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {data.pedidos}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-green-700">{data.itens}</td>
                      <td className="p-3 text-right font-medium text-gray-600">{avg}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}