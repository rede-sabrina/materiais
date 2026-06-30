import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchOrders, fetchMe, fetchUsers, deleteOrder } from '../services/api'
import Badge from '../components/Badge'
import { useModal } from '../components/Modal'
import Pagination from '../components/Pagination'

export default function OrdersList(){
  const [orders, setOrders] = useState([])
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 15
  const navigate = useNavigate()
  const { showModal } = useModal()

  // token parsing similar to ReturnsList to determine admin
  function parseJwt(token){
    try{ if(!token) return null; const parts = token.split('.'); if(parts.length<2) return null; const payload = parts[1]; const b = payload.replace(/-/g,'+').replace(/_/g,'/'); const json = decodeURIComponent(atob(b).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')); return JSON.parse(json); } catch(e){ return null }
  }
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(()=>{
    fetchOrders().then(setOrders).catch(()=>setOrders([]))
    fetchMe().then(setMe).catch(()=>setMe(null))
    if(isAdmin){
      fetchUsers().then(setUsers).catch(()=>setUsers([]))
    }
  }, [])

  // Resolve store name (loja) – admin can see any, regular sees own via me
  function resolveStore(order){
    if(isAdmin){
      const u = users.find(u=> (u.loja||u.username)===order.loja)
      return u?.loja || u?.username || order.loja
    }
    return me?.loja || me?.username || order.loja
  }

  // filter by date range (admin only UI, but apply for all)
  const filteredByDate = orders.filter(o=> {
    const date = new Date(o.createdAt||o.data)
    if(startDate && date < new Date(startDate)) return false
    if(endDate && date > new Date(endDate)) return false
    return true
  })

  const sorted = [...filteredByDate].sort((a,b)=> new Date(b.createdAt||b.data||0) - new Date(a.createdAt||a.data||0))
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page-1)*pageSize, page*pageSize)

  function formatDate(v){
    if(!v) return '—'
    const d = new Date(v)
    return d.toLocaleString()
  }

    // Print grouped by store (admin only) with modern layout
    function printByStore(){
      const groups = {};
      sorted.forEach(o=>{
        const store = resolveStore(o);
        if(!groups[store]) groups[store] = [];
        groups[store].push(o);
      });
      let html = `<html><head><title>Pedidos por Loja</title><style>
        body{font-family:Arial,Helvetica,Inter,sans-serif;padding:20px;margin:0;}
        .store-section{margin-bottom:30px;}
        .store-header{background:#2c3e50;color:#fff;padding:12px 20px;border-radius:8px;font-size:1.3rem;}
        .order-block{page-break-inside:avoid;margin-bottom:20px;}
        .order-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #ccc;border-radius:6px;overflow:hidden;}
        .order-table th{background:#ecf0f1;padding:10px 12px;font-weight:600;text-align:left;}
        .order-table td{padding:10px 12px;border-bottom:1px solid #ccc;vertical-align:middle;}
        .order-table tr:nth-child(even){background:#fafafa;}
        .order-number{font-weight:bold;color:#2980b9;}
        .order-date{color:#7f8c8d;font-size:0.9rem;}
        .items-label{margin-top:6px;margin-bottom:4px;font-size:0.95rem;color:#2c3e50;}
        .items-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #bbb;border-radius:4px;overflow:hidden;}
        .items-table th{background:#d6eaf8;padding:8px;font-weight:500;color:#2c3e50;}
        .items-table td{padding:8px;border-bottom:1px solid #ccc;vertical-align:middle;}
        .items-table tr:nth-child(even){background:#f2f9fc;}
      </style></head><body>`;
      Object.entries(groups).forEach(([store, list])=>{
        html += `<div class="store-section"><div class="store-header">Loja: ${store}</div>`;
        list.forEach(o=>{
          html += `<div class="order-block"><table class="order-table"><thead><tr><th>Número do Pedido</th><th>Data</th></tr></thead><tbody><tr><td class="order-number">${o.numero}</td><td class="order-date">${formatDate(o.createdAt||o.data)}</td></tr></tbody></table>`;
          if(Array.isArray(o.itens) && o.itens.length>0){
            html += `<div class="items-label">Itens do pedido</div><table class="items-table"><thead><tr><th>Produto</th><th>Quantidade</th></tr></thead><tbody>`;
            o.itens.forEach(item=>{
              html += `<tr><td>${item.nome || ''}</td><td>${item.quantidade || ''}</td></tr>`;
            });
            html += `</tbody></table>`;
          }
          html += `</div>`; // close order-block
        });
        html += `</div>`; // close store-section
      });
      html += `</body></html>`;
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      w.print();
    }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Registro Pedidos</h2>
      {isAdmin && (
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm">De:</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
          <label className="text-sm">Até:</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
          <button onClick={printByStore} className="px-3 py-1 bg-primary text-white rounded">Imprimir por Loja</button>
        </div>
      )}
      <div className="bg-white rounded-md shadow p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="p-2">Número</th>
              <th className="p-2">Loja</th>
              <th className="p-2">Status</th>
              <th className="p-2">Data registro</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(o=> (
              <tr key={o._id || o.id} className="border-t">
                <td className="p-2">{o.numero}</td>
                <td className="p-2">{resolveStore(o)}</td>
                <td className="p-2"><Badge>{o.status}</Badge></td>
                <td className="p-2 text-sm text-slate-500">{formatDate(o.createdAt || o.data)}</td>
                <td className="p-2">
                  <button onClick={()=>navigate(`/pedidos/${o._id || o.id}`)} className="px-3 py-1 bg-primary text-white rounded text-sm hover:brightness-95 mr-2">Visualizar</button>
{ (isAdmin || (me && (o.ownerId === (me.id || me.username)))) && (
  <button onClick={()=>{
    showModal({
      title: 'Confirmar exclusão',
      body: 'Deseja realmente excluir este pedido?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        showModal({title:'Excluindo', loading:true, hideActions:true})
        try{
          await deleteOrder(o._id || o.id)
          setOrders(prev=>prev.filter(p=> (p._id||p.id) !== (o._id||o.id)))
          showModal({title:'Pedido excluído', body:'Pedido removido com sucesso.', confirmLabel:'Fechar'})
        }catch(e){
          console.error(e)
          showModal({title:'Erro', body:'Não foi possível excluir o pedido.', confirmLabel:'Fechar'})
        }
      }
    })
  }} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:brightness-95">Excluir</button>
)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-slate-500">Mostrando {pageItems.length} de {sorted.length}</div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}
