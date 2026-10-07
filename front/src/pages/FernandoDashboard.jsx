import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchFernandoDashboardStats, updateFernandoOrderStatus, patchFernandoOrderAuth } from '../services/api'
import { useModal } from '../components/Modal'
import { OPCOES_AUTORIZADOR, STATUS_FERNANDO, formatarItens } from '../data/fernandoProdutos'

const STATUS_COLORS = {
  'Pendente':     'bg-yellow-100 text-yellow-800',
  'Em andamento': 'bg-blue-100 text-blue-800',
  'Atendido':     'bg-green-100 text-green-800',
  'Cancelado':    'bg-gray-100 text-gray-600',
}

export default function FernandoDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pendente: 0, emAndamento: 0, atendido: 0, cancelado: 0 })
  const [recentPending, setRecentPending] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const navigate = useNavigate()
  const { showModal } = useModal()

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchFernandoDashboardStats({ startDate, endDate })
      setStats(data.stats || { total: 0, pendente: 0, emAndamento: 0, atendido: 0, cancelado: 0 })
      setRecentPending(data.recentPending || [])
    } catch (e) {
      console.error(e)
    }
  }, [startDate, endDate])

  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    setStartDate(thirtyDaysAgo.toISOString().slice(0, 10))
    setEndDate(today.toISOString().slice(0, 10))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  function formatDateShort(v) {
    if (!v) return '—'
    return new Date(v).toLocaleDateString('pt-BR')
  }

  function formatDate(v) {
    if (!v) return '—'
    return new Date(v).toLocaleString('pt-BR')
  }

  // ─── Gerenciar pedido pendente direto do dashboard ─────────────────────────

  function handleManageOrder(order) {
    let selectedStatus = order.status
    let selectedAutorizador = order.autorizadoPor || ''
    let observacaoLocal = order.observacaoFernando || ''

    const linhasItens = formatarItens(order.itens || [])

    showModal({
      title: `Pedido ${order.numero}`,
      body: (
        <div className="space-y-5 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
            <div><span className="text-gray-500">Loja:</span> <strong>{order.loja}</strong></div>
            <div><span className="text-gray-500">Solicitante:</span> <strong>{order.solicitante}</strong></div>
            <div><span className="text-gray-500">Data:</span> {formatDate(order.createdAt)}</div>
          </div>

          {/* Itens */}
          <div>
            <p className="font-semibold mb-2">📦 Itens</p>
            <ul className="space-y-1 bg-gray-50 rounded-lg p-3">
              {linhasItens.map((linha, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{linha}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Autorizado por */}
          <div>
            <p className="font-semibold mb-2">✅ Autorizado por</p>
            <div className="flex flex-wrap gap-3">
              {OPCOES_AUTORIZADOR.map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dashAutorizadoPor"
                    defaultValue={op}
                    defaultChecked={selectedAutorizador === op}
                    onChange={() => { selectedAutorizador = op }}
                    className="accent-primary"
                  />
                  <span>{op}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="font-semibold mb-2">🔄 Status</p>
            <select
              defaultValue={selectedStatus}
              onChange={e => { selectedStatus = e.target.value }}
              className="border px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-primary"
            >
              {STATUS_FERNANDO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Observação */}
          <div>
            <p className="font-semibold mb-2">📝 Observação</p>
            <textarea
              defaultValue={observacaoLocal}
              onChange={e => { observacaoLocal = e.target.value }}
              rows={2}
              placeholder="Anotação interna..."
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      ),
      confirmLabel: 'Salvar',
      cancelLabel: 'Fechar',
      onConfirm: async () => {
        try {
          await updateFernandoOrderStatus(order._id || order.id, selectedStatus, observacaoLocal)
          if (selectedAutorizador) {
            await patchFernandoOrderAuth(order._id || order.id, selectedAutorizador, observacaoLocal)
          }
          await loadStats()
          showModal({ title: 'Salvo', body: 'Pedido atualizado.', confirmLabel: 'Fechar' })
        } catch (err) {
          console.error(err)
          showModal({ title: 'Erro', body: 'Não foi possível salvar.', confirmLabel: 'Fechar' })
        }
      }
    })
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando dashboard...</div>

  return (
    <div className="space-y-6">
      {/* Header + filtro de período */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 Dashboard — Pedidos Fernando</h2>
          <p className="text-sm text-gray-500 mt-1">Gerenciamento e acompanhamento das solicitações das lojas</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard color="from-blue-500 to-blue-600" label="Total" value={stats.total} icon="📦" sub="No período" />
        <KPICard color="from-yellow-500 to-orange-500" label="⚠️ Pendentes" value={stats.pendente} icon="⏳" sub="Aguardando análise" border />
        <KPICard color="from-sky-500 to-sky-600" label="Em andamento" value={stats.emAndamento} icon="🔄" sub="Em processamento" />
        <KPICard color="from-green-500 to-green-600" label="✅ Atendidos" value={stats.atendido} icon="✅" sub="Concluídos" />
      </div>

      {/* Pedidos pendentes recentes */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">⏳ Pendentes Recentes</h3>
          <button
            onClick={() => navigate('/pedidos-fernando')}
            className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:brightness-95"
          >
            Ver Todos
          </button>
        </div>

        {recentPending.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhum pedido pendente no momento 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide">
                  <th className="p-2">Nº</th>
                  <th className="p-2">Loja</th>
                  <th className="p-2">Itens</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentPending.map((o, idx) => (
                  <tr key={o._id || idx} className="border-t hover:bg-slate-50">
                    <td className="p-2 font-mono text-sm">{o.numero}</td>
                    <td className="p-2 text-sm">{o.loja}</td>
                    <td className="p-2 text-sm">
                      {(o.itens || []).slice(0, 2).map(it => `${it.quantidade}x ${it.produto}`).join(', ')}
                      {(o.itens || []).length > 2 && ` +${o.itens.length - 2}`}
                    </td>
                    <td className="p-2 text-sm text-slate-500">{formatDateShort(o.createdAt)}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleManageOrder(o)}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:brightness-95"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({ color, label, value, icon, sub, border }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-lg ${border ? 'border-2 border-orange-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
          <p className="text-white/60 text-xs mt-2">{sub}</p>
        </div>
        <div className="text-5xl opacity-25">{icon}</div>
      </div>
    </div>
  )
}