import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useModal } from '../components/Modal'
import { registerUser } from '../services/api'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function SecretRegister(){
  const nav = useNavigate()
  const { showModal } = useModal()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loja, setLoja] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    try{
      if(!API_BASE){
        // dev fallback: add a blank token and navigate
        await registerUser({ username, password, loja })
        showModal({ title: 'Usuário criado', body: 'Usuário criado (dev)', confirmLabel: 'Fechar', onConfirm: ()=> nav('/login') })
        return
      }
      const res = await registerUser({ username, password, loja })
      showModal({ title: 'Usuário criado', body: res.message || 'Usuário criado', confirmLabel: 'Fechar', onConfirm: ()=> nav('/login') })
    } catch(err){
      showModal({ title: 'Erro', body: 'Erro ao criar usuário: ' + (err.message || err), confirmLabel: 'Fechar' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">Criar Usuário (secreto)</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm">Usuário</label>
            <Input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" required />
          </div>
          <div>
            <label className="text-sm">Senha</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="******" required />
          </div>
          <div>
            <label className="text-sm">Loja (opcional)</label>
            <Input type="text" value={loja} onChange={e=>setLoja(e.target.value)} placeholder="loja1" />
          </div>
          <div className="text-center">
            <Button type="submit">Criar Usuário</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
