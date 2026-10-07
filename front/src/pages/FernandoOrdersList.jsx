import React, { useEffect, useState, useCallback } from 'react'
import { fetchFernandoOrders, updateFernandoOrderStatus, fetchFernandoOrderById, deleteFernandoOrder, patchFernandoOrderAuth } from '../services/api'
import Badge from '../components/Badge'
import { useModal } from '../components/Modal'
import Pagination from '../components/Pagination'
import { OPCOES_AUTORIZADOR, STATUS_FERNANDO, formatarItens } from '../data/fernandoProdutos'

function parseJwt(token) {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const b = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(b).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(json)
  } catch (e) { return null }
}

const STATUS_COLORS = {
  'Pendente':     'bg-yellow-100 text-yellow-800',
  'Em andamento': 'bg-blue-100 text-blue-800',
  'Atendido':     'bg-green-100 text-green-800',
  'Cancelado':    'bg-gray-100 text-gray-600',
}

export default function FernandoOrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 15
  const { showModal } = useModal()

  const [filters, setFilters] = useState({
    status: '',
    loja: '',
    startDate: '',
    endDate: '',
    q: ''
  })
  const [allStores, setAllStores] = useState([])

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isFernandoOrAdmin = user && (user.role === 'FERNANDO' || user.role === 'ADMIN')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchFernandoOrders(filters)
      setOrders(Array.isArray(data) ? data : [])
      const stores = [...new Set((Array.isArray(data) ? data : []).map(o => o.loja).filter(Boolean))].sort()
      setAllStores(stores)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [filters])

  useEffect(() => { loadOrders() }, [loadOrders])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ status: '', loja: '', startDate: '', endDate: '', q: '' })
    setPage(1)
  }

  function formatDate(v) {
    if (!v) return '—'
    return new Date(v).toLocaleString('pt-BR')
  }

  function formatDateShort(v) {
    if (!v) return '—'
    return new Date(v).toLocaleDateString('pt-BR')
  }

  // ─── Abrir detalhe / gerenciar pedido ──────────────────────────────────────

  function openOrderDetail(order) {
    // Estado local para o modal de detalhe
    let selectedStatus = order.status
    let selectedAutorizador = order.autorizadoPor || ''
    let observacaoLocal = order.observacaoFernando || ''

    const linhasItens = formatarItens(order.itens || [])

    showModal({
      title: `Pedido ${order.numero}`,
      body: (
        <OrderDetailModal
          order={order}
          linhasItens={linhasItens}
          formatDate={formatDate}
          onStatusChange={v => { selectedStatus = v }}
          onAutorizadorChange={v => { selectedAutorizador = v }}
          onObservacaoChange={v => { observacaoLocal = v }}
          isFernandoOrAdmin={isFernandoOrAdmin}
        />
      ),
      confirmLabel: isFernandoOrAdmin ? 'Salvar' : 'Fechar',
      cancelLabel: isFernandoOrAdmin ? 'Cancelar' : undefined,
      onConfirm: isFernandoOrAdmin ? async () => {
        try {
          // Atualizar status
          if (selectedStatus !== order.status || observacaoLocal !== order.observacaoFernando) {
            await updateFernandoOrderStatus(order._id || order.id, selectedStatus, observacaoLocal)
          }
          // Atualizar autorizador
          if (selectedAutorizador !== (order.autorizadoPor || '')) {
            await patchFernandoOrderAuth(order._id || order.id, selectedAutorizador, observacaoLocal)
          }
          await loadOrders()
          showModal({ title: 'Salvo', body: 'Pedido atualizado com sucesso.', confirmLabel: 'Fechar' })
        } catch (err) {
          console.error(err)
          showModal({ title: 'Erro', body: 'Não foi possível salvar as alterações.', confirmLabel: 'Fechar' })
        }
      } : undefined
    })
  }

  // ─── Deletar ───────────────────────────────────────────────────────────────

  function handleDelete(order) {
    showModal({
      title: 'Confirmar exclusão',
      body: `Deseja excluir o pedido ${order.numero}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        showModal({ title: 'Excluindo...', loading: true, hideActions: true })
        try {
          await deleteFernandoOrder(order._id || order.id)
          await loadOrders()
          showModal({ title: 'Excluído', body: 'Pedido removido com sucesso.', confirmLabel: 'Fechar' })
        } catch (e) {
          console.error(e)
          showModal({ title: 'Erro', body: 'Não foi possível excluir o pedido.', confirmLabel: 'Fechar' })
        }
      }
    })
  }

  // ─── Paginação ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const pageItems = orders.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Pedidos para Fernando</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie os pedidos recebidos das lojas</p>
        </div>
        <span className="text-sm text-gray-500">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nº pedido, loja, produto..."
              value={filters.q}
              onChange={e => handleFilterChange('q', e.target.value)}
              className="border px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="border px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos</option>
              {STATUS_FERNANDO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Loja</label>
            <select
              value={filters.loja}
              onChange={e => handleFilterChange('loja', e.target.value)}
              className="border px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todas</option>
              {allStores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">De</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="border px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Até</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="border px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium h-fit"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Carregando pedidos...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-500 bg-gray-50 uppercase tracking-wide">
                    <th className="p-3">Nº Pedido</th>
                    <th className="p-3">Loja</th>
                    <th className="p-3">Solicitante</th>
                    <th className="p-3">Itens</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Autorizado por</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length > 0 ? pageItems.map((o, idx) => (
                    <tr key={o._id || idx} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-mono text-sm">{o.numero}</td>
                      <td className="p-3 text-sm">{o.loja}</td>
                      <td className="p-3 text-sm">{o.solicitante}</td>
                      <td className="p-3 text-sm max-w-xs">
                        {(o.itens || []).length > 0 ? (
                          <span>
                            {o.itens.slice(0, 2).map(it => `${it.quantidade}x ${it.produto}`).join(', ')}
                            {o.itens.length > 2 && ` +${o.itens.length - 2}`}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-3 text-sm text-slate-500">{formatDateShort(o.createdAt)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {o.autorizadoPor
                          ? <span className="text-green-700 font-medium">{o.autorizadoPor}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openOrderDetail(o)}
                            className="px-3 py-1 bg-primary text-white rounded text-sm hover:brightness-95"
                          >
                            {isFernandoOrAdmin ? 'Gerenciar' : 'Ver'}
                          </button>
                          {isFernandoOrAdmin && (
                            <button
                              onClick={() => handleDelete(o)}
                              className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm hover:bg-red-100"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-400 py-12">
                        Nenhum pedido encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Mostrando {pageItems.length} de {orders.length}
              </span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal de detalhe/gerenciamento do pedido ─────────────────────────────────
function OrderDetailModal({ order, linhasItens, formatDate, onStatusChange, onAutorizadorChange, onObservacaoChange, isFernandoOrAdmin }) {
  const [status, setStatus] = useState(order.status)
  const [autorizadoPor, setAutorizadoPor] = useState(order.autorizadoPor || '')
  const [observacao, setObservacao] = useState(order.observacaoFernando || '')

  function handleStatus(v) {
    setStatus(v)
    onStatusChange(v)
  }

  function handleAutorizador(v) {
    setAutorizadoPor(v)
    onAutorizadorChange(v)
  }

  function handleObservacao(v) {
    setObservacao(v)
    onObservacaoChange(v)
  }

  return (
    <div className="space-y-5 text-sm max-h-[70vh] overflow-y-auto pr-1">
      {/* Info do pedido */}
      <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
        <div><span className="text-gray-500">Loja:</span> <strong>{order.loja}</strong></div>
        <div><span className="text-gray-500">Solicitante:</span> <strong>{order.solicitante}</strong></div>
        <div><span className="text-gray-500">Data:</span> {formatDate(order.createdAt)}</div>
        <div><span className="text-gray-500">Nº:</span> <span className="font-mono">{order.numero}</span></div>
      </div>

      {/* Itens */}
      <div>
        <p className="font-semibold text-gray-800 mb-2">📦 Itens solicitados</p>
        <ul className="space-y-1.5 bg-gray-50 rounded-lg p-3">
          {linhasItens.length > 0
            ? linhasItens.map((linha, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span className="text-gray-800">{linha}</span>
                </li>
              ))
            : <li className="text-gray-400">Nenhum item</li>
          }
        </ul>
      </div>

      {/* Observações da loja */}
      {order.observacoes && (
        <div>
          <p className="font-semibold text-gray-800 mb-1">💬 Observações da loja</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{order.observacoes}</p>
        </div>
      )}

      {/* Campos editáveis pelo Fernando */}
      {isFernandoOrAdmin && (
        <>
          <hr />

          {/* Autorizado por */}
          <div>
            <p className="font-semibold text-gray-800 mb-2">✅ Autorizado por</p>
            <div className="flex flex-wrap gap-3">
              {OPCOES_AUTORIZADOR.map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="autorizadoPor"
                    value={op}
                    checked={autorizadoPor === op}
                    onChange={() => handleAutorizador(op)}
                    className="accent-primary"
                  />
                  <span>{op}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                <input
                  type="radio"
                  name="autorizadoPor"
                  value=""
                  checked={autorizadoPor === ''}
                  onChange={() => handleAutorizador('')}
                  className="accent-gray-400"
                />
                <span className="text-sm">Limpar</span>
              </label>
            </div>
            {order.autorizadoEm && autorizadoPor && (
              <p className="text-xs text-gray-400 mt-1">
                Registrado em: {formatDate(order.autorizadoEm)}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="font-semibold text-gray-800 mb-2">🔄 Status do pedido</p>
            <select
              value={status}
              onChange={e => handleStatus(e.target.value)}
              className="border px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {STATUS_FERNANDO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Observação do Fernando */}
          <div>
            <p className="font-semibold text-gray-800 mb-2">📝 Observação interna</p>
            <textarea
              value={observacao}
              onChange={e => handleObservacao(e.target.value)}
              rows={3}
              placeholder="Anotação sobre o pedido (visível para a loja)..."
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </>
      )}
    </div>
  )
}