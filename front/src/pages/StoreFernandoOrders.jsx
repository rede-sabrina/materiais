import React, { useEffect, useState } from 'react'
import { fetchStoreFernandoOrders, createFernandoOrder } from '../services/api'
import { useModal } from '../components/Modal'
import Badge from '../components/Badge'
import { PRODUTOS_FERNANDO, OPCOES_DEGRAUS, getCamposProduto, formatarItens } from '../data/fernandoProdutos'

// ─── Item em branco ────────────────────────────────────────────────────────────
function criarItemVazio() {
  return {
    produto: '',
    quantidade: 1,
    tamanho: '',
    degraus: '',
    cor: '',
    modelo: '',
    descricaoOutros: '',
  }
}

// ─── Componente de linha de item ──────────────────────────────────────────────
function ItemRow({ item, index, onChange, onRemove, mostrarRemover }) {
  const campos = getCamposProduto(item.produto)

  function handleField(field, value) {
    onChange(index, { ...item, [field]: value })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Item {index + 1}
        </span>
        {mostrarRemover && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            ✕ Remover
          </button>
        )}
      </div>

      {/* Produto + Quantidade na mesma linha */}
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Produto <span className="text-red-500">*</span>
          </label>
          <select
            value={item.produto}
            onChange={e => handleField('produto', e.target.value)}
            required
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="">Selecione...</option>
            {PRODUTOS_FERNANDO.map(p => (
              <option key={p.nome} value={p.nome}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qtd <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={item.quantidade}
            onChange={e => handleField('quantidade', e.target.value)}
            required
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Campos condicionais */}

      {/* TAPETE → Tamanho */}
      {campos.includes('tamanho') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
          <input
            type="text"
            value={item.tamanho}
            onChange={e => handleField('tamanho', e.target.value)}
            placeholder="Ex: 1,5m x 2m"
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      {/* ESCADA → Degraus */}
      {campos.includes('degraus') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de degraus</label>
          <div className="flex flex-wrap gap-3">
            {OPCOES_DEGRAUS.map(op => (
              <label key={op} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`degraus-${index}`}
                  value={op}
                  checked={item.degraus === op}
                  onChange={e => handleField('degraus', e.target.value)}
                  className="accent-primary"
                />
                <span className="text-sm">{op}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TINTA → Cor e Modelo */}
      {campos.includes('cor') && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input
              type="text"
              value={item.cor}
              onChange={e => handleField('cor', e.target.value)}
              placeholder="Ex: Preto"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo da impressora</label>
            <input
              type="text"
              value={item.modelo}
              onChange={e => handleField('modelo', e.target.value)}
              placeholder="Ex: Epson L3250"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* OUTROS → Descrição */}
      {campos.includes('descricaoOutros') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descreva o material necessário <span className="text-red-500">*</span>
          </label>
          <textarea
            value={item.descricaoOutros}
            onChange={e => handleField('descricaoOutros', e.target.value)}
            rows={3}
            placeholder="Descreva detalhadamente o que precisa..."
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function StoreFernandoOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [itens, setItens] = useState([criarItemVazio()])
  const [observacoes, setObservacoes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showModal } = useModal()

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await fetchStoreFernandoOrders({})
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handleItemChange(index, updated) {
    // Ao trocar o produto, limpar campos condicionais
    const old = itens[index]
    const produtoMudou = updated.produto !== old.produto
    setItens(prev => prev.map((it, i) => {
      if (i !== index) return it
      if (produtoMudou) {
        return {
          ...criarItemVazio(),
          produto: updated.produto,
          quantidade: updated.quantidade,
        }
      }
      return updated
    }))
  }

  function addItem() {
    setItens(prev => [...prev, criarItemVazio()])
  }

  function removeItem(index) {
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setItens([criarItemVazio()])
    setObservacoes('')
  }

  function validateForm() {
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i]
      if (!item.produto) return `Selecione um produto para o item ${i + 1}`
      if (!item.quantidade || Number(item.quantidade) < 1) return `Informe a quantidade do item ${i + 1}`
      if (item.produto === 'Outros' && !item.descricaoOutros.trim()) {
        return `Descreva o material para o item ${i + 1} (Outros)`
      }
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const erro = validateForm()
    if (erro) { alert(erro); return }

    setSubmitting(true)
    showModal({ title: 'Enviando pedido...', loading: true, hideActions: true })

    try {
      await createFernandoOrder({
        itens: itens.map(it => ({
          produto: it.produto,
          quantidade: Number(it.quantidade),
          tamanho: it.tamanho || '',
          degraus: it.degraus || '',
          cor: it.cor || '',
          modelo: it.modelo || '',
          descricaoOutros: it.descricaoOutros || '',
        })),
        observacoes: observacoes.trim()
      })

      showModal({
        title: '✅ Pedido enviado!',
        body: 'Seu pedido foi enviado ao Fernando com sucesso.',
        confirmLabel: 'Fechar'
      })
      setShowForm(false)
      resetForm()
      loadOrders()
    } catch (err) {
      console.error(err)
      showModal({ title: 'Erro', body: 'Não foi possível enviar o pedido.', confirmLabel: 'Fechar' })
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(v) {
    if (!v) return '—'
    return new Date(v).toLocaleDateString('pt-BR')
  }

  function formatDateTime(v) {
    if (!v) return '—'
    return new Date(v).toLocaleString('pt-BR')
  }

  function handleViewDetails(order) {
    const linhasItens = formatarItens(order.itens || [])
    showModal({
      title: `Pedido ${order.numero}`,
      body: (
        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><strong>Loja:</strong> {order.loja}</div>
            <div><strong>Data:</strong> {formatDateTime(order.createdAt)}</div>
            <div><strong>Status:</strong> <Badge>{order.status}</Badge></div>
            {order.autorizadoPor && (
              <div><strong>Autorizado por:</strong> {order.autorizadoPor}</div>
            )}
          </div>

          <div>
            <strong className="block mb-2">Itens solicitados:</strong>
            <ul className="space-y-1">
              {linhasItens.map((linha, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{linha}</span>
                </li>
              ))}
            </ul>
          </div>

          {order.observacoes && (
            <div>
              <strong>Observações:</strong>
              <p className="mt-1 text-gray-700">{order.observacoes}</p>
            </div>
          )}

          {order.observacaoFernando && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <strong className="text-blue-800">Observação do Fernando:</strong>
              <p className="mt-1 text-blue-700">{order.observacaoFernando}</p>
            </div>
          )}
        </div>
      ),
      confirmLabel: 'Fechar'
    })
  }

  const statusColors = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Em andamento': 'bg-blue-100 text-blue-800',
    'Atendido': 'bg-green-100 text-green-800',
    'Cancelado': 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Pedidos para Fernando</h2>
          <p className="text-sm text-gray-500 mt-1">
            Solicite materiais, equipamentos e outros itens diretamente ao Fernando.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm() }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-95 font-medium"
        >
          + Novo Pedido
        </button>
      </div>

      {/* Listagem */}
      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Carregando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📦</div>
            <p>Nenhum pedido realizado ainda.</p>
            <p className="text-sm mt-1">Clique em "Novo Pedido" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-500 bg-gray-50 uppercase tracking-wide">
                  <th className="p-3">Nº Pedido</th>
                  <th className="p-3">Itens</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Autorizado por</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o._id || idx} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-mono text-sm">{o.numero}</td>
                    <td className="p-3 text-sm max-w-xs">
                      {(o.itens || []).length > 0 ? (
                        <ul className="space-y-0.5">
                          {(o.itens || []).slice(0, 3).map((it, i) => (
                            <li key={i} className="text-gray-700">
                              {it.quantidade}x {it.produto}
                            </li>
                          ))}
                          {(o.itens || []).length > 3 && (
                            <li className="text-gray-400 text-xs">+{o.itens.length - 3} mais...</li>
                          )}
                        </ul>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-3 text-sm text-slate-500">{formatDate(o.createdAt)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[o.status] || 'bg-gray-100 text-gray-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {o.autorizadoPor || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleViewDetails(o)}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:brightness-95"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de novo pedido */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            {/* Cabeçalho do modal */}
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">📦 Novo Pedido para Fernando</h3>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Corpo do modal */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                {/* Lista de itens */}
                <div className="space-y-3">
                  {itens.map((item, index) => (
                    <ItemRow
                      key={index}
                      item={item}
                      index={index}
                      onChange={handleItemChange}
                      onRemove={removeItem}
                      mostrarRemover={itens.length > 1}
                    />
                  ))}
                </div>

                {/* Botão adicionar item */}
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-primary hover:text-primary transition-colors text-sm font-medium"
                >
                  + Adicionar outro item
                </button>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Informações adicionais sobre o pedido..."
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rodapé do modal */}
              <div className="p-6 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:brightness-95 disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Enviando...' : 'Enviar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}