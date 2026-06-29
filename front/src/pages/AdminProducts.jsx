import React, { useEffect, useState } from 'react'
import { useModal } from '../components/Modal'
import { useNavigate } from 'react-router-dom'

// Helper para criar produto usando o endpoint que gera EAN internamente
async function createProductApi({ codigo, nome }){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, nome })
  })
  if(!res.ok) throw new Error('create product failed')
  return res.json()
}

// Helper para desativar produto
async function deactivateProductApi(codigo){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${codigo}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  })
  if(!res.ok) throw new Error('deactivate failed')
  return res.json()
}

export default function AdminProducts(){
  const [products, setProducts] = useState([])
  const [newProd, setNewProd] = useState({ codigo: '', nome: '' })
  const { showModal } = useModal()
  const nav = useNavigate()

  // Carrega lista de produtos
  useEffect(()=>{
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(r=>r.json())
      .then(setProducts)
      .catch(()=>setProducts([]))
  }, [])

  async function handleAdd(){
    const { codigo, nome } = newProd
    if(!codigo || !nome){
      alert('Preencha código e nome')
      return
    }
    try{
      const created = await createProductApi({ codigo, nome })
      setProducts(prev=>[created, ...prev])
      setNewProd({ codigo: '', nome: '' })
      showModal({ title: 'Produto criado', body: `Produto ${created.nome} adicionado.`, confirmLabel: 'Fechar' })
    }catch(e){
      console.error(e)
      alert('Erro ao criar produto')
    }
  }

  async function handleDeactivate(codigo){
    if(!window.confirm('Desativar este produto?')) return
    try{
      const updated = await deactivateProductApi(codigo)
      setProducts(prev=> prev.map(p=> p.codigo===codigo ? updated : p))
      showModal({ title: 'Produto desativado', body: `Código ${codigo} está agora inativo.`, confirmLabel: 'Fechar' })
    }catch(e){
      console.error(e)
      alert('Erro ao desativar')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Gerenciar Produtos (ADMIN)</h2>
      <div className="card p-4">
        <h3 className="font-medium mb-2">Adicionar novo produto</h3>
        <div className="flex items-center gap-2 mb-4">
          <input placeholder="Código" className="border px-2 py-1 rounded w-24" value={newProd.codigo} onChange={e=>setNewProd(p=>({ ...p, codigo: e.target.value }))} />
          <input placeholder="Nome" className="border px-2 py-1 rounded w-48" value={newProd.nome} onChange={e=>setNewProd(p=>({ ...p, nome: e.target.value }))} />
        </div>
        <button onClick={handleAdd} className="px-3 py-1 bg-primary text-white rounded">Adicionar</button>

        <hr className="my-6" />
        <h3 className="font-medium mb-2">Produtos cadastrados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-sm text-slate-700">
                <th className="p-2">Código</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Status</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p=> (
                <tr key={p.codigo || p.ean} className="border-t">
                  <td className="p-2">{p.codigo}</td>
                  <td className="p-2">{p.nome}</td>
                  <td className="p-2">{p.active === false ? 'Inativo' : 'Ativo'}</td>
                  <td className="p-2">
                    {p.active !== false && (
                      <button onClick={()=>handleDeactivate(p.codigo)} className="px-2 py-1 border rounded text-sm">Desativar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
