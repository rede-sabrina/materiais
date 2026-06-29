import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchOrders, fetchMe, fetchUsers } from '../services/api'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'

export default function OrdersList(){
  const [orders, setOrders] = useState([])
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 15
  const navigate = useNavigate()

  // token parsing similar to ReturnsList to determine admin
  function parseJwt(token){
    try{ if(!token) return null; const parts = token.split('.'); if(parts.length<2) return null; const payload = parts[1]; const b = payload.replace(/-/g,'+').replace(/_/g,'/'); const json = decodeURIComponent(atob(b).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')); return JSON.parse(json); } catch(e){ return null }
  }
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'

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

  const sorted = [...orders].sort((a,b)=> new Date(b.createdAt||b.data||0) - new Date(a.createdAt||a.data||0))
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page-1)*pageSize, page*pageSize)

  function formatDate(v){
    if(!v) return '—'
    const d = new Date(v)
    return d.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Registro Pedidos</h2>
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
                  <button onClick={()=>navigate(`/pedidos/${o._id || o.id}`)} className="px-3 py-1 bg-primary text-white rounded text-sm hover:brightness-95">Visualizar</button>
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
