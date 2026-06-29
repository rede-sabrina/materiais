import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderById, fetchMe, fetchUsers } from '../services/api'
import Badge from '../components/Badge'

export default function OrderDetail(){
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  function parseJwt(token){
    try{ if(!token) return null; const parts = token.split('.'); if(parts.length<2) return null; const payload = parts[1]; const b = payload.replace(/-/g,'+').replace(/_/g,'/'); const json = decodeURIComponent(atob(b).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')); return JSON.parse(json); } catch(e){ return null }
  }
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'

  useEffect(()=>{
    fetchOrderById(id).then(setOrder).catch(()=>setOrder(null))
    fetchMe().then(setMe).catch(()=>setMe(null))
    if(isAdmin) fetchUsers().then(setUsers).catch(()=>setUsers([]))
  }, [id])

  function resolveStore(){
    if(!order) return ''
    if(isAdmin){
      const u = users.find(u=> (u.loja||u.username)===order.loja)
      return u?.loja || u?.username || order.loja
    }
    return me?.loja || me?.username || order.loja
  }

  function formatDate(v){
    if(!v) return '—'
    const d = new Date(v)
    return d.toLocaleString()
  }

  if(!order) return <div className="p-4">Carregando...</div>

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Detalhes do Pedido {order.numero}</h2>
      <div className="bg-white rounded-md shadow p-4">
        <p><strong>Loja:</strong> {resolveStore()}</p>
        <p><strong>Status:</strong> <Badge>{order.status}</Badge></p>
        <p><strong>Data registro:</strong> {formatDate(order.createdAt || order.data)}</p>
        <h3 className="mt-4 font-medium">Itens</h3>
        <table className="w-full text-left mt-2">
          <thead>
            <tr className="text-sm text-slate-500">
<th className="p-2">Código</th>
               <th className="p-2">Nome</th>
               <th className="p-2">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {order.itens && order.itens.map((i,idx)=> (
              <tr key={idx} className="border-t">
<td className="p-2">{i.codigo}</td>
                 <td className="p-2">{i.nome}</td>
                 <td className="p-2">{i.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <button onClick={()=>navigate('/pedidos')} className="px-3 py-1 bg-primary text-white rounded">Voltar à lista</button>
        </div>
      </div>
    </div>
  )
}
