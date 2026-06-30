import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useModal } from '../components/Modal'
import { fetchReturns } from '../services/api'
const API_BASE = import.meta.env.VITE_API_URL || ''

export default function Login(){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showModal, hideModal } = useModal()

  async function handleSubmit(e){
    e.preventDefault()
    if(isSubmitting) return
    if(!API_BASE){
      // dev fallback
      sessionStorage.setItem('token', '')
      sessionStorage.setItem('token_expires_at', String(Date.now() + 2 * 60 * 60 * 1000))
      nav('/')
      return
    }
    try{
      setIsSubmitting(true)
      showModal({ title: 'Entrando', body: 'Validando suas credenciais...', hideActions: true, loading: true })
      const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: email, password }) })
      if(!res.ok) throw new Error('login failed')
      const data = await res.json()
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('token_expires_at', String(Date.now() + 2 * 60 * 60 * 1000))
      hideModal()
      nav('/')
    } catch(err){
      hideModal()
      showModal({ title: 'Erro', body: 'Erro ao autenticar', confirmLabel: 'Fechar' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm">Usuário</label>
            <Input type="text" value={email} onChange={e=>setEmail(e.target.value)} placeholder="loja00" required />
          </div>
          <div>
            <label className="text-sm">Senha</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="******" required />
          </div>
          <div className="text-center">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
