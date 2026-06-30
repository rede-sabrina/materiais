import React from 'react'
import { NavLink } from 'react-router-dom'

function Item({to, children, badge}){
  return (
    <NavLink to={to} className={({isActive})=>`block px-4 py-2 rounded-md mb-1 ${isActive? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
      <span className="flex items-center justify-between">
        <span>{children}</span>
        {badge ? (
          <span className="ml-3 min-w-[20px] text-center text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{badge}</span>
        ) : null}
      </span>
    </NavLink>
  )
}

export default function Sidebar(){
  // decode JWT payload (no external deps) to check user role
  function parseJwt(token){
    try{
      if(!token) return null
      const parts = token.split('.')
      if(parts.length<2) return null
      const payload = parts[1]
      const b = payload.replace(/-/g, '+').replace(/_/g, '/')
      const json = decodeURIComponent(atob(b).split('').map(c=> '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))
      return JSON.parse(json)
    } catch(e){ return null }
  }

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'

  return (
    <aside className="w-64 bg-white border-r p-6 flex flex-col justify-between">
      <div>
        <div className="mb-8">
          <div className="text-2xl font-bold text-primary">Materiais</div>
          <div className="text-sm text-slate-500">Rede Sabrina</div>
        </div>

        <nav>
          <Item to="/">Dashboard</Item>
          <Item to="/pedidos">Registro Pedidos</Item>
          <Item to="/pedidos/novo">Novo Pedido</Item>
          {isAdmin && (
            <>
              <Item to="/admin/produtos">Estoque</Item>
              <Item to="/reports">Relatórios</Item>
              <Item to="/admin/users">Gerenciar Usuários</Item>
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}
