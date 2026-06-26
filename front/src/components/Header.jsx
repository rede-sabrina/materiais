import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMe } from '../services/api'

export default function Header(){
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(()=>{
    fetchMe().then(u=> setUser(u)).catch(()=>{
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
      if(token){
        try{ const payload = JSON.parse(atob(token.split('.')[1])); setUser(payload) }catch(e){}
      }
    })
  }, [])

  const displayName = user ? (user.username || user.name || (user.role === 'ADMIN' ? 'Admin' : 'Usuário')) : 'Carregando...'
  const loja = user && (user.loja || user.store || '')

  // derive a short store number to show in the avatar, prefer numeric suffix like '01'
  function getStoreNumber(lojaStr, user){
    if(!lojaStr) return user && user.username ? (user.username[0]||'U').toUpperCase() : 'A'
    const m = String(lojaStr).match(/(\d{1,3})\s*$/)
    if(m) return String(m[1]).padStart(2, '0')
    // fallback: try to find any number inside
    const any = String(lojaStr).match(/(\d{1,3})/)
    if(any) return String(any[1]).padStart(2,'0')
    // else take first two letters
    return String(lojaStr).slice(0,2).toUpperCase()
  }
  const storeNumber = getStoreNumber(loja, user)

  function handleLogout(){
    try{ sessionStorage.removeItem('token') } catch(e){}
    try{ sessionStorage.removeItem('token_expires_at') } catch(e){}
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div className="text-lg font-semibold transition-opacity duration-300 ease-in-out">Olá, {displayName}</div>
      <div className="flex items-center gap-4">
        <button className="text-sm text-slate-600 hover:text-slate-900" onClick={handleLogout}>Sair</button>
        <div className="text-sm text-slate-600">Loja: <span className="font-medium">{loja}</span></div>
        <div title={`Loja: ${loja || '—'}`} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md animate-pulse font-semibold">{storeNumber}</div>
      </div>
    </header>
  )
}
