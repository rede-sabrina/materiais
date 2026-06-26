import React, { useEffect, useState } from 'react'
import { fetchUsers, createUserAdmin, setUserRole, deleteUserAdmin, updateUserAdmin } from '../services/api'
import Input from '../components/Input'
import Button from '../components/Button'
import { useModal } from '../components/Modal'

export default function AdminUsers(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ username:'', password:'', loja:'', role:'LOJA', email: '', razaoSocial: '', cnpj: '', endereco: '', cep: '', numeroLoja: '', cidade: '', estado: '' })
  const [editing, setEditing] = useState(null)
  const { showModal } = useModal()

  async function load(){
    setLoading(true)
    try{ const data = await fetchUsers(); setUsers(data) }catch(e){ showModal({ title: 'Erro', body: 'Erro ao carregar usuários', confirmLabel: 'Fechar' }) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  async function handleSubmit(e){
    e.preventDefault()
    try{
      if(editing){
        await updateUserAdmin(editing, { username: form.username, loja: form.loja, password: form.password || undefined, role: form.role, email: form.email, razaoSocial: form.razaoSocial, cnpj: form.cnpj, endereco: form.endereco, cep: form.cep, numeroLoja: form.numeroLoja, cidade: form.cidade, estado: form.estado })
        setEditing(null)
      } else {
        await createUserAdmin(form)
      }
      setForm({ username:'', password:'', loja:'', role:'LOJA', email: '', razaoSocial: '', cnpj: '', endereco: '', cep: '', numeroLoja: '', cidade: '', estado: '' })
      await load()
    } catch(e){ showModal({ title: 'Erro', body: 'Erro: ' + (e.message||e), confirmLabel: 'Fechar' }) }
  }

  function startEdit(u){
    setEditing(u._id || u.id)
    setForm({ username: u.username || '', password:'', loja: u.loja || '', role: u.role || 'LOJA', email: u.email || '', razaoSocial: u.razaoSocial || '', cnpj: u.cnpj || '', endereco: u.endereco || '', cep: u.cep || '', numeroLoja: u.numeroLoja || '', cidade: u.cidade || '', estado: u.estado || '' })
  }

  function cancelEdit(){ setEditing(null); setForm({ username:'', password:'', loja:'', role:'LOJA', email: '', razaoSocial: '', cnpj: '', endereco: '', cep: '', numeroLoja: '', cidade: '', estado: '' }) }

  async function changeRole(id, role){
    try{ await setUserRole(id, role); await load() } catch(e){ showModal({ title: 'Erro', body: 'Erro: ' + (e.message||e), confirmLabel: 'Fechar' }) }
  }

  async function handleDelete(id){
    showModal({ title: 'Remover usuário', body: 'Remover usuário?', confirmLabel: 'Remover', cancelLabel: 'Cancelar', onConfirm: async ()=>{
      try{ await deleteUserAdmin(id); await load() } catch(e){ showModal({ title: 'Erro', body: 'Erro: ' + (e.message||e), confirmLabel: 'Fechar' }) }
    }})
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">{editing ? 'Editar Usuário' : 'Criar Usuário'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Usuário" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
            <Input placeholder="Senha" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} {...(editing ? {} : { required: true })} />
            <Input placeholder="Loja" value={form.loja} onChange={e=>setForm({...form, loja:e.target.value})} />
            <Input placeholder="Razão Social" value={form.razaoSocial} onChange={e=>setForm({...form, razaoSocial:e.target.value})} />
            <Input placeholder="CNPJ" value={form.cnpj} onChange={e=>setForm({...form, cnpj:e.target.value})} />
            <Input placeholder="Endereço" value={form.endereco} onChange={e=>setForm({...form, endereco:e.target.value})} />
            <Input placeholder="CEP" value={form.cep} onChange={e=>setForm({...form, cep:e.target.value})} />
            <Input placeholder="Número da Loja" value={form.numeroLoja} onChange={e=>setForm({...form, numeroLoja:e.target.value})} />
            <Input placeholder="Cidade" value={form.cidade} onChange={e=>setForm({...form, cidade:e.target.value})} />
            <Input placeholder="Estado" value={form.estado} onChange={e=>setForm({...form, estado:e.target.value})} />
            <Input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            <div className="flex items-center gap-2">
              <label className="text-sm">Role</label>
              <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="input">
                <option value="LOJA">LOJA</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editing ? 'Salvar' : 'Criar'}</Button>
              {editing && <button type="button" className="px-3 py-2 border rounded" onClick={cancelEdit}>Cancelar</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="col-span-2">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Usuários</h3>
          {loading ? <div>Carregando...</div> : (
            <div className="space-y-2">
              {users.map(u=> (
                <div key={u._id || u.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{u.username}</div>
                      <div className="text-sm text-slate-500">{u.loja || '—'}</div>
                      <div className="text-sm text-slate-500">{u.email || '—'}</div>
                    <div className="text-sm mt-1"><span className="font-semibold">Role:</span> {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 border rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={()=>startEdit(u)}>Editar</button>
                    {u.role !== 'ADMIN' ? <button className="px-3 py-1 bg-amber-100 rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={()=>changeRole(u._id || u.id, 'ADMIN')}>Promover</button> : <button className="px-3 py-1 bg-slate-100 rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={()=>changeRole(u._id || u.id, 'LOJA')}>Rebaixar</button>}
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={()=>handleDelete(u._id || u.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
