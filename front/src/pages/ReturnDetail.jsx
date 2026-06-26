import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchReturnById, fetchProducts, updateReturn, updateReturnStatus, deleteReturn, fetchUsers } from '../services/api'
import Badge from '../components/Badge'
import { useModal } from '../components/Modal'
import { buildMotivo } from '../utils/buildMotivo'

export default function ReturnDetail() {
  const { id } = useParams()
  const [devolucao, setDevolucao] = useState(null)
  const [products, setProducts] = useState([])
  const nav = useNavigate()
  const [showNfdModal, setShowNfdModal] = useState(false)
  const [showFormatModal, setShowFormatModal] = useState(false)
  const [formatType, setFormatType] = useState('dcenter')
  const [selectedItems, setSelectedItems] = useState([])
  const [copied, setCopied] = useState(false)
  const [adminChecked, setAdminChecked] = useState([])
  const [nfdNumber, setNfdNumber] = useState('')
  const [nfdDate, setNfdDate] = useState('')
  const [nfdValue, setNfdValue] = useState('')
  const [storeData, setStoreData] = useState(null)

  useEffect(() => { fetchReturnById(id).then(r => setDevolucao(r)); fetchProducts().then(p => setProducts(p)) }, [id])
  useEffect(() => {
  async function loadStoreData() {
    try {
      const users = await fetchUsers()

      const foundStore = users.find(
        u => String(u.loja) === String(devolucao?.loja)
      )

      setStoreData(foundStore || null)
    } catch (err) {
      console.error('Erro ao buscar loja', err)
    }
  }

  if (devolucao?.loja) {
    loadStoreData()
  }
}, [devolucao])
  if (!devolucao) return <div>Carregando...</div>
  

  function formatDate(value) {
    if (!value) return '—'
    try { return new Date(value).toLocaleString() } catch (e) { return String(value) }
  }

  function formatDateBR(value) {
    if (!value) return '—'
    try {
      const d = new Date(value)
      // show date in pt-BR; include time if time component exists
      const date = d.toLocaleDateString('pt-BR')
      const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0
      return hasTime ? `${date} ${d.toLocaleTimeString('pt-BR')}` : date
    } catch (e) { return String(value) }
  }

  function formatDateOnly(value) {
    if (!value) return '—'
    try {
      // if value is YYYY-MM-DD or starts with that, use it directly to avoid timezone shifts
      if (typeof value === 'string') {
        const m = value.match(/^(\d{4}-\d{2}-\d{2})/)
        if (m) {
          const [y, mo, d] = m[1].split('-')
          return `${d}/${mo}/${y}`
        }
      }
      const d = new Date(value)
      return d.toLocaleDateString('pt-BR')
    } catch (e) { return String(value) }
  }

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

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'
  const { showModal } = useModal()

  const statusOptionsAdmin = ['Pendente', 'Solicitado', 'Coletado', 'Concluído', 'Negado']
  const statusOptionsLoja = ['Pendente', 'Solicitado', 'Coletado']

  function handleItemChange(index, field, value) {
    const copy = { ...devolucao }
    copy.items = copy.items.map((it, i) => i === index ? { ...it, [field]: value } : it)
    setDevolucao(copy)
  }

  async function handleSave() {
    try {
      const idToUse = devolucao._id || devolucao.id
      await updateReturn(idToUse, { protocolo: devolucao.protocolo || '' })
      showModal({ title: 'Sucesso', body: 'Protocolo salvo', confirmLabel: 'Fechar' })
    } catch (e) { showModal({ title: 'Erro', body: 'Erro ao salvar', confirmLabel: 'Fechar' }) }
  }

  async function handleMarkCollected() {
    try {
      const idToUse = devolucao._id || devolucao.id
      await updateReturnStatus(idToUse, 'Coletado')
      setDevolucao(prev => ({ ...prev, status: 'Coletado' }))
      showModal({ title: 'Sucesso', body: 'Status atualizado para Coletado', confirmLabel: 'Fechar' })
    } catch (e) { showModal({ title: 'Erro', body: 'Erro ao atualizar status', confirmLabel: 'Fechar' }) }
  }

  async function handleDelete() {
    const idToUse = devolucao._id || devolucao.id
    showModal({
      title: 'Confirmar exclusão', body: 'Confirma exclusão da devolução?', confirmLabel: 'Excluir', cancelLabel: 'Cancelar', onConfirm: async () => {
        try {
          await deleteReturn(idToUse)
          nav('/devolucoes')
        } catch (e) { showModal({ title: 'Erro', body: 'Erro ao excluir', confirmLabel: 'Fechar' }) }
      }
    })
  }

  function formatValue(value) {
    if (value == null) return ''
    const str = String(value)
    return str === '—' ? '' : str
  }

  function getSelectedItems() {
    if (!Array.isArray(devolucao.items)) return []
    if (selectedItems.length === 0) return devolucao.items
    return devolucao.items.filter((_, idx) => selectedItems.includes(idx))
  }

  function buildDcenterMessage() {
    const items = getSelectedItems()
    const lines = []
    lines.push(`Razão Social: ${formatValue(storeData?.razaoSocial)}`)
    lines.push(`CNPJ: ${formatValue(storeData?.cnpj)}`)
    lines.push(`NF compra: ${formatValue(devolucao.nota)}`)
    lines.push(`NF de devolução (NFD): ${formatValue(devolucao.nfdNumber)}`)
    lines.push('Série NFD (se houver): 1')
    lines.push(`Data NFD: ${formatValue(formatDateOnly(devolucao.nfdDate))}`)
    lines.push(`Motivo da devolução: ${formatValue(buildMotivo(items))}`)
    lines.push('')
    for (const item of items) {
      lines.push(`Produto: ${formatValue(item.nome)}`)
      lines.push(`Código Produto: ${formatValue(item.codigo)}`)
      lines.push(`Código de Barras: ${formatValue(item.ean)}`)
      lines.push(`Quantidade devolvida: ${formatValue(item.devolvida ?? item.quantidade)}`)
      lines.push(`Motivo devolução: ${formatValue(item.motivo)}`)
      lines.push('')
    }
    lines.push('---------------------------------')
    return lines.join('\n')
  }

  function getFormattedMessage() {
    return buildDcenterMessage()
  }

  function toggleItem(idx) {
    setSelectedItems(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  function toggleAdminCheck(idx) {
    setAdminChecked(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  function openFormatModal(type) {
    setFormatType(type)
    setSelectedItems([])
    setCopied(false)
    setShowFormatModal(true)
  }

  async function handleCopyMessage() {
    try {
      const text = getFormattedMessage()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      showModal({ title: 'Erro', body: 'Não foi possível copiar a mensagem.', confirmLabel: 'Fechar' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Nota {devolucao.nota}</h2>
          <div className="text-sm font-semibold">Loja: {devolucao.loja} • <Badge>{devolucao.status}</Badge></div>
          <div className="text-sm font-semibold">Distribuidora: {devolucao.distribuidora || '—'}</div>
          <div className="text-sm font-semibold">Data emissão: {formatDateBR(devolucao.data)} • Data registro: {formatDate(devolucao.createdAt)}</div>

          <div className="mt-3 flex items-center gap-4">
            <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded flex-1">
              <div className="text-xs text-slate-500">Protocolo</div>
              {isAdmin ? (
                <input className="w-full mt-1 text-lg font-medium bg-white border px-2 py-1 rounded" value={devolucao.protocolo || ''} onChange={e => setDevolucao(prev => ({ ...prev, protocolo: e.target.value }))} />
              ) : (
                <div className="mt-1 text-lg font-medium text-slate-800">{devolucao.protocolo || '—'}</div>
              )}
            </div>

            <div>
              {devolucao.nfdNumber ? (
                <div className="text-sm text-green-700 font-medium">NFD: {devolucao.nfdNumber} • {formatDateOnly(devolucao.nfdDate)}</div>
              ) : (
                <div className="text-sm text-slate-500">NFD: —</div>
              )}
              <button onClick={() => {
                // prefill NFD fields: number, date, value and quantity
                setNfdNumber(devolucao.nfdNumber || '')
                setNfdDate(devolucao.nfdDate || '')
                setNfdValue(devolucao.nfdValue != null ? String(devolucao.nfdValue) : '')
                setShowNfdModal(true)
              }} className="mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition transform hover:-translate-y-1 hover:scale-105">Preencher NFD</button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-56">
                <div className="text-xs text-slate-500">Status da devolução</div>
                {isAdmin ? (
                  <select className="mt-1 w-full border px-2 py-1 rounded" value={devolucao.status} onChange={async (e) => {
                    const newStatus = e.target.value
                    try {
                      const idToUse = devolucao._id || devolucao.id
                      await updateReturnStatus(idToUse, newStatus)
                      setDevolucao(prev => ({ ...prev, status: newStatus }))
                      showModal({ title: 'Sucesso', body: 'Status atualizado', confirmLabel: 'Fechar' })
                    } catch (err) { showModal({ title: 'Erro', body: 'Erro ao atualizar status', confirmLabel: 'Fechar' }) }
                  }}>
                    {statusOptionsAdmin.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <select className="mt-1 w-full border px-2 py-1 rounded" value={devolucao.status} onChange={async (e) => {
                    const newStatus = e.target.value
                    try {
                      const idToUse = devolucao._id || devolucao.id
                      await updateReturnStatus(idToUse, newStatus)
                      setDevolucao(prev => ({ ...prev, status: newStatus }))
                      showModal({ title: 'Sucesso', body: 'Status atualizado', confirmLabel: 'Fechar' })
                    } catch (err) { showModal({ title: 'Erro', body: 'Erro ao atualizar status', confirmLabel: 'Fechar' }) }
                  }}>
                    {statusOptionsLoja.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
              {isAdmin && (
                <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!devolucao.notaAnexada}
                    onChange={async (e) => {
                      const checked = e.target.checked
                      try {
                        const idToUse = devolucao._id || devolucao.id
                        await updateReturn(idToUse, { notaAnexada: checked })
                        setDevolucao(prev => ({ ...prev, notaAnexada: checked }))
                        showModal({ title: 'Sucesso', body: 'Nota anexada atualizada', confirmLabel: 'Fechar' })
                      } catch (err) { showModal({ title: 'Erro', body: 'Erro ao atualizar nota anexada', confirmLabel: 'Fechar' }) }
                    }}
                  />
                  Nota Anexada
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow p-4">
        <div className="flex items-center justify-end gap-3 mb-3">
          {isAdmin && (
            <button onClick={() => openFormatModal('dcenter')} className="px-3 py-1 bg-slate-800 text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Funções</button>
          )}
          {isAdmin && <button onClick={handleSave} className="px-3 py-1 bg-primary text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Salvar protocolo</button>}
          {!isAdmin && <button onClick={handleMarkCollected} className="px-3 py-1 bg-amber-500 text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Marcar coletado</button>}
          <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Excluir</button>
        </div>

        <div className="mb-3 text-sm font-semibold text-slate-600">
          Total de registros na devolução: {Array.isArray(devolucao.items) ? devolucao.items.length : 0}
        </div>

        <div className="space-y-2">
          {devolucao.items.map((item, idx) => (
            <div key={item.ean || idx} className="flex items-start gap-3">
              {isAdmin && (
                <div className="pt-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={adminChecked.includes(idx)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleAdminCheck(idx)
                    }}
                  />
                </div>
              )}

              <div className="p-3 border rounded flex-1">
                <div className="font-semibold">{item.nome}</div>

                <div className="text-sm mt-1">
                  <span className="font-semibold">Código Produto:</span>{' '}
                  <span className="font-normal">
                    {item.codigo || '—'}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-semibold">Código de Barras:</span>{' '}
                  <span className="font-normal">
                    {item.ean || '—'}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-semibold">Quantidade devolvida:</span>{' '}
                  <span className="font-normal">
                    {item.devolvida ?? item.quantidade}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-semibold">Motivo devolução:</span>{' '}
                  <span className="font-normal">
                    {item.motivo || '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {Array.isArray(devolucao.sobras) && devolucao.sobras.length > 0 && (
          <div className="mt-6">
            <div className="border-t pt-4">
              <div className="text-sm font-semibold mb-2">Sobras (fora da nota)</div>
              <div className="space-y-2">
                {devolucao.sobras.map((s, idx) => (
                  <div key={s.ean || idx} className="p-3 border rounded text-sm">
                    <div className="font-medium">{s.nome}</div>
                    <div className="text-slate-500">EAN: {s.ean || '—'} • Quantidade: {s.quantidade}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {showNfdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="text-lg font-semibold mb-3">Preencher Nota Fiscal de Devolução</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Número da NFD</label>
                <input className="w-full border px-2 py-1 rounded mt-1" value={nfdNumber} onChange={e => setNfdNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Data de emissão</label>
                <input type="date" className="w-full border px-2 py-1 rounded mt-1" value={nfdDate} onChange={e => setNfdDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Valor total (R$)</label>
                <input className="w-full border px-2 py-1 rounded mt-1" value={nfdValue} onChange={e => setNfdValue(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="px-3 py-1 border rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={() => setShowNfdModal(false)}>Cancelar</button>
                <button className="px-3 py-1 bg-primary text-white rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={async () => {
                  try {
                    const idToUse = devolucao._id || devolucao.id
                    // send plain YYYY-MM-DD string to backend
                    const payload = {
                      nfdNumber: nfdNumber || undefined,
                      nfdDate: nfdDate || undefined,
                      nfdValue: nfdValue !== '' ? nfdValue : undefined
                    }
                    await updateReturn(idToUse, payload)
                    setDevolucao(prev => ({ ...prev, nfdNumber: nfdNumber || undefined, nfdDate: nfdDate || undefined, nfdValue: nfdValue !== '' ? Number(String(nfdValue).replace(',', '.')) : undefined }))
                    setShowNfdModal(false)
                    showModal({ title: 'Sucesso', body: 'NFD registrada', confirmLabel: 'Fechar' })
                  } catch (err) { showModal({ title: 'Erro', body: 'Erro ao salvar NFD', confirmLabel: 'Fechar' }) }
                }}>Salvar NFD</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFormatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-[720px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">Funções</h3>
              <button className="px-3 py-1 border rounded" onClick={() => setShowFormatModal(false)}>Fechar</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFormatType('dcenter')} className={`px-3 py-1 rounded border ${formatType === 'dcenter' ? 'bg-slate-800 text-white' : 'bg-white'}`}>Formatar e-mail D.CENTER</button>
              {formatType === 'dcenter' && (
                <button onClick={handleCopyMessage} className="ml-auto px-3 py-1 bg-emerald-600 text-white rounded">{copied ? 'Copiado!' : 'Copiar mensagem'}</button>
              )}
            </div>
            {formatType === 'dcenter' && (
              <textarea
                className="w-full border rounded p-3 text-sm min-h-[260px]"
                value={getFormattedMessage()}
                readOnly
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
