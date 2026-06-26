import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import BarChart from '../components/BarChart'
import { fetchReturns } from '../services/api'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    pendente: 0,
    solicitado: 0,
    coletado: 0,
    concluido: 0,
    negado: 0
  })

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [distStats, setDistStats] = useState([])

  // 👉 DICIONÁRIO OFICIAL
  const distribuidoraMap = {
    'DISTRIBUIDORA DE MEDICAMENTOS SANTA CRUZ LTDA': 'Santa Cruz',
    'PROFARMA DIST. PROD. FARMACEUTICOS': 'Profarma',
    'SC DISTRIBUICAO LTDA': 'Panpharma',
    'D CENTER DISTRIBUIDORA LTDA.': 'D.Center',
    'SOLFARMA COMERCIO DE PRODUTOS FARMACEUTICOS S.A.': 'Solfarma',
    'J.K. MEDICAMENTOS LTDA': 'JK',
    'SERVIMED COMERCIAL LTDA': 'Servimed',
    'KEEP COMMERCE ATACADISTA DE COSMETICOS LTDA': 'K. Commerce',
    'TOPSERVICE DISTRIBUIDORA': 'TopService',
    'MANTIQUEIRA DISTRIBUIDORA DE PRODUTOS DE HIGIENE LTDA':'Mantiqueira',
    'MILFARMA COMERCIAL LTDA 08241229000200 ':'Milfarma'
  }

  const normalize = (str) =>
    (str || '')
      .toUpperCase()
      .trim()

  function filterByDate(items, start, end) {
    if (!start && !end) return items

    const sd = start ? new Date(start) : null
    const ed = end ? new Date(end) : null

    return items.filter(it => {
      const raw = it.createdAt || it.data || it.date
      if (!raw) return false

      const d = new Date(raw)
      if (isNaN(d)) return false

      if (sd && d < sd) return false
      if (ed && d > ed) return false

      return true
    })
  }

  async function load(params) {
    try {
      const items = await fetchReturns(params)
      const filtered = filterByDate(items || [], params?.startDate, params?.endDate)

      const s = {
        pendente: 0,
        solicitado: 0,
        coletado: 0,
        concluido: 0,
        negado: 0
      }

      const dist = {}

      filtered.forEach(i => {
        const st = (i.status || '').toLowerCase()

        // status geral
        if (st === 'pendente') s.pendente++
        else if (st === 'solicitado') s.solicitado++
        else if (st === 'coletado') s.coletado++
        else if (st === 'concluído' || st === 'concluido') s.concluido++
        else if (st === 'negado' || st === 'recusado') s.negado++

        // 👉 DISTRIBUIDORA NORMALIZADA
        const rawNome = i.distribuidora || 'Não informado'
        const nome =
          distribuidoraMap[normalize(rawNome)] || rawNome

        if (!dist[nome]) {
          dist[nome] = { concluido: 0, negado: 0 }
        }

        if (st === 'concluído' || st === 'concluido') {
          dist[nome].concluido++
        }

        if (st === 'negado' || st === 'recusado') {
          dist[nome].negado++
        }
      })

      const distArray = Object.keys(dist).map(key => {
        const item = dist[key]

        const finalizadas = item.concluido + item.negado

        const taxa =
          finalizadas > 0
            ? ((item.concluido / finalizadas) * 100)
            : 0

        return {
          distribuidora: key,
          concluido: item.concluido,
          negado: item.negado,
          taxa: Number(taxa.toFixed(1))
        }
      })

      setStats(s)
      setDistStats(distArray)

    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // KPI
  const total =
    stats.pendente +
    stats.solicitado +
    stats.coletado +
    stats.concluido +
    stats.negado

  const emAndamento =
    stats.pendente +
    stats.solicitado +
    stats.coletado

  const taxaConclusao =
    total > 0 ? ((stats.concluido / total) * 100).toFixed(1) : '0.0'

  const taxaNegativa =
    total > 0 ? ((stats.negado / total) * 100).toFixed(1) : '0.0'

  const finalizadas = stats.concluido + stats.negado

  const aproveitamento =
    finalizadas > 0
      ? ((stats.concluido / finalizadas) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold">Dashboard</h2>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm block text-slate-600">Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
          </div>

          <div>
            <label className="text-sm block text-slate-600">Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => load({ startDate, endDate })} className="px-3 py-2 bg-primary text-white rounded">
              Aplicar
            </button>

            <button onClick={() => { setStartDate(''); setEndDate(''); load() }} className="px-3 py-2 border rounded">
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div className="grid grid-cols-5 gap-4">
        <Card><div className="text-sm text-slate-500">Pendentes</div><div className="text-2xl font-bold">{stats.pendente}</div></Card>
        <Card><div className="text-sm text-slate-500">Solicitadas</div><div className="text-2xl font-bold">{stats.solicitado}</div></Card>
        <Card><div className="text-sm text-slate-500">Coletadas</div><div className="text-2xl font-bold">{stats.coletado}</div></Card>
        <Card><div className="text-sm text-slate-500">Concluídas</div><div className="text-2xl font-bold">{stats.concluido}</div></Card>
        <Card><div className="text-sm text-slate-500">Negadas</div><div className="text-2xl font-bold">{stats.negado}</div></Card>
      </div>

      {/* GRÁFICO STATUS */}
      <div className="bg-white p-4 rounded shadow-sm">
        <BarChart
          height={220}
          data={[
            { label: 'Pendente', value: stats.pendente, color: '#FFE7AA' },
            { label: 'Solicitada', value: stats.solicitado, color: '#7CB77F' },
            { label: 'Coletada', value: stats.coletado, color: '#6504C2' },
            { label: 'Concluída', value: stats.concluido, color: '#05a70a' },
            { label: 'Negada', value: stats.negado, color: '#B50B0B' }
          ]}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-slate-500">Taxa Conclusão</div>
          <div className="text-3xl font-bold text-green-700">{taxaConclusao}%</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Aproveitamento</div>
          <div className="text-3xl font-bold text-emerald-700">{aproveitamento}%</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Em andamento</div>
          <div className="text-3xl font-bold text-blue-700">{emAndamento}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Negativas</div>
          <div className="text-3xl font-bold text-red-700">{taxaNegativa}%</div>
        </Card>
      </div>

      {/* TABELA DISTRIBUIDORA */}
      <div>
        <h3 className="text-lg font-medium mb-2">
          Taxa de Aprovação por Distribuidora
        </h3>

        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Distribuidora</th>
                <th className="p-3">Concluídas</th>
                <th className="p-3">Negadas</th>
                <th className="p-3">Aproveitamento</th>
              </tr>
            </thead>

            <tbody>
              {distStats.map((d, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3 font-medium">{d.distribuidora}</td>
                  <td className="p-3">{d.concluido}</td>
                  <td className="p-3">{d.negado}</td>
                  <td className="p-3 font-bold text-green-700">{d.taxa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRÁFICO DISTRIBUIDORA */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h3 className="text-lg font-medium mb-2">
          Aprovação por Distribuidora (%)
        </h3>

        <BarChart
          height={240}
          data={distStats.map(d => ({
            label: d.distribuidora,
            value: d.taxa,
            color: '#047857'
          }))}
        />
      </div>

    </div>
  )
}