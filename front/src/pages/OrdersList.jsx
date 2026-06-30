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
      const orderDate = new Date(o.createdAt||o.data).toISOString().slice(0,10);
      if(startDate && orderDate < startDate) return false;
      if(endDate && orderDate > endDate) return false;
      return true;
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
      // Filtrar apenas pedidos pendentes
      const pendingOrders = sorted.filter(o => o.status === 'Pendente');
      
      const groups = {};
      pendingOrders.forEach(o=>{
        const store = resolveStore(o);
        if(!groups[store]) groups[store] = [];
        groups[store].push(o);
      });
      let html = `<html><head><title>Pedidos Pendentes por Loja</title><style>
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body{font-family:Arial,Helvetica,Inter,sans-serif;padding:20px;margin:0;background:#fff;}
        .store-section{margin-bottom:40px;padding:20px;background:#f9fafb;border-radius:8px;}
        .store-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:16px 24px;border-radius:8px;font-size:1.5rem;font-weight:bold;margin-bottom:20px;box-shadow:0 2px 8px rgba(102,126,234,0.3);}
        .order-block{page-break-inside:avoid;margin-bottom:25px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;}
        .order-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;margin-bottom:12px;}
        .order-table th{background:#f3f4f6;padding:12px 16px;font-weight:700;text-align:left;color:#374151;font-size:0.95rem;border-bottom:1px solid #9ca3af;}
        .order-table td{padding:12px 16px;border-bottom:1px solid #e5e7eb;vertical-align:middle;color:#1f2937;}
        .order-table tr:last-child td{border-bottom:none;}
        .order-table tr:nth-child(even){background:#f9fafb;}
        .order-number{font-weight:800;color:#4f46e5;font-size:1.05rem;}
        .order-date{color:#6b7280;font-size:0.9rem;}
        .items-label{margin:12px 0 8px 0;font-size:1rem;font-weight:700;color:#374151;padding-left:4px;}
        .items-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;}
        .items-table th{background:#e0e7ff;padding:10px 14px;font-weight:600;color:#4338ca;font-size:0.95rem;border-bottom:1px solid #a5b4fc;}
        .items-table td{padding:10px 14px;border-bottom:1px solid #e0e7ff;vertical-align:middle;color:#374151;}
        .items-table tr:last-child td{border-bottom:none;}
        .items-table tr:nth-child(even){background:#f0f4ff;}
        .no-orders{color:#9ca3af;font-style:italic;text-align:center;padding:20px;}
        .pending-badge{display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold;margin-bottom:15px;}
      </style></head><body>
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#667eea;font-size:24px;margin:0 0 10px 0;">📦 Pedidos Pendentes por Loja</h1>
          <p style="color:#666;font-size:14px;">Período: <strong>${new Date(startDate+'T00:00:00').toLocaleDateString('pt-BR')}</strong> até <strong>${new Date(endDate+'T23:59:59').toLocaleDateString('pt-BR')}</strong></p>
          <span class="pending-badge">⏳ Apenas pedidos PENDENTES</span>
        </div>`;
      
      if(Object.keys(groups).length === 0){
        html += `<div class="no-orders">Nenhum pedido pendente no período selecionado</div>`;
      } else {
      Object.entries(groups).forEach(([store, list])=>{
        html += `<div class="store-section"><div class="store-header">📦 ${store}</div>`;
        if(list.length === 0){
          html += `<div class="no-orders">Nenhum pedido neste período</div>`;
        } else {
          list.forEach(o=>{
            html += `<div class="order-block">
              <table class="order-table">
                <thead><tr><th>Número do Pedido</th><th>Data</th></tr></thead>
                <tbody><tr><td class="order-number">${o.numero}</td><td class="order-date">${formatDate(o.createdAt||o.data)}</td></tr></tbody>
              </table>`;
            if(Array.isArray(o.itens) && o.itens.length>0){
              html += `<div class="items-label">📋 Itens do pedido</div>
                <table class="items-table">
                  <thead><tr><th>Produto</th><th>Quantidade</th></tr></thead>
                  <tbody>`;
              o.itens.forEach(item=>{
                html += `<tr><td>${item.nome || ''}</td><td><strong>${item.quantidade || ''}</strong></td></tr>`;
              });
              html += `</tbody></table>`;
            }
            html += `</div>`; // close order-block
          });
        }
        html += `</div>`; // close store-section
      });
      html += `</body></html>`;
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      setTimeout(()=>{ w.print(); }, 250);
    }

    // Nova função: Imprimir Matriz Geral (todas as lojas em uma única folha) - Apenas Pendentes
    function printMatrix(){
      // Filtrar apenas pedidos pendentes
      const pendingOrders = sorted.filter(o => o.status === 'Pendente');
      
      // Coletar todos os produtos únicos
      const allProducts = new Map();
      pendingOrders.forEach(o=>{
        (o.itens||[]).forEach(it=>{
          const key = it.nome || it.codigo || 'Desconhecido';
          if(!allProducts.has(key)){
            allProducts.set(key, { nome: it.nome, codigo: it.codigo, ean: it.ean });
          }
        });
      });

      // Ordenar produtos alfabeticamente
      const products = Array.from(allProducts.values()).sort((a,b)=> a.nome.localeCompare(b.nome));

      // Coletar todas as lojas
      const allStores = Array.from(new Set(pendingOrders.map(o=> resolveStore(o)))).sort();

      // Construir matriz: produto × loja → quantidade
      const matrix = {};
      products.forEach(p=>{
        matrix[p.nome] = {};
        allStores.forEach(s=>{ matrix[p.nome][s] = 0; });
      });

      // Preencher matriz com quantidades
      pendingOrders.forEach(o=>{
        const store = resolveStore(o);
        (o.itens||[]).forEach(it=>{
          const nome = it.nome || it.codigo || 'Desconhecido';
          if(matrix[nome]){
            matrix[nome][store] += (Number(it.quantidade) || 0);
          }
        });
      });

      // Gerar HTML
      let html = `<html><head><title>Matriz de Separação - Pedidos Pendentes</title><style>
        @media print {
          @page { margin: 0.8cm; size: A4 landscape; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body{font-family:Arial,Helvetica,sans-serif;padding:10px;margin:0;background:#fff;}
        .period{text-align:center;color:#666;font-size:11px;margin:0 0 10px 0;}
        .pending-badge{display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:bold;margin:8px 0;}
        .matrix-table{width:100%;border-collapse:collapse;font-size:9px;}
        .matrix-table th{background:#667eea;color:#fff;padding:6px 4px;font-weight:bold;border:2px solid #000;text-align:center;white-space:nowrap;}
        .matrix-table td{padding:5px 4px;border:2px solid #000;text-align:center;vertical-align:middle;font-weight:600;background:#fff;}
        .matrix-table .product-col{text-align:left;font-weight:bold;background:#f9fafb;color:#1f2937;min-width:120px;border:2px solid #000;}
        .matrix-table .qty-cell{background:#fef3c7;color:#92400e;}
        .matrix-table .qty-high{background:#fbbf24;color:#92400e;font-weight:800;}
        .matrix-table .qty-very-high{background:#f59e0b;color:#fff;font-weight:900;}
        .matrix-table tr:nth-child(even) .product-col{background:#f3f4f6;}
        .footer{margin-top:8px;text-align:center;color:#999;font-size:8px;border-top:1px solid #e5e7eb;padding-top:6px;}
      </style></head><body>
        <p class="period"><strong>Pedidos Pendentes</strong> • Período: ${new Date(startDate+'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(endDate+'T23:59:59').toLocaleDateString('pt-BR')}</p>
        <div style="text-align:center;"><span class="pending-badge">⏳ Apenas PENDENTES</span></div>
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="product-col">Produto</th>
              ${allStores.map(s=>`<th>${s.length > 15 ? s.substring(0,15)+'...' : s}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${products.map(p=>`
              <tr>
                <td class="product-col">${p.nome}</td>
                ${allStores.map(s=>{
                  const qty = matrix[p.nome][s] || 0;
                  let cellClass = qty > 0 ? 'qty-cell' : '';
                  let cellContent = qty > 0 ? String(qty) : '';
                  if(qty >= 10){ cellClass = 'qty-very-high'; }
                  else if(qty >= 5){ cellClass = 'qty-high'; }
                  else if(qty === 0){ cellClass = ''; cellContent = ''; }
                  return `<td class="${cellClass}">${cellContent}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Gerado em ${new Date().toLocaleString('pt-BR')} • ${products.length} produtos • ${allStores.length} lojas
        </div>
      </body></html>`;

      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      setTimeout(()=>{ w.print(); }, 250);
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
          <button onClick={printMatrix} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">🖨️ Imprimir Pedidos</button>
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
