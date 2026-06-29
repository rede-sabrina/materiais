import React, { useEffect, useState } from 'react'
import { useModal } from '../components/Modal'

// ---------- API helpers ----------
async function createProductApi({ codigo, nome }){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ codigo, nome })
  })
  if(!res.ok) throw new Error('create product failed')
  return res.json()
}

async function updateProductApi(codigo, data){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${codigo}`,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  })
  if(!res.ok) throw new Error('update product failed')
  return res.json()
}

async function deleteProductApi(codigo){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${codigo}`,{
    method:'DELETE',
    headers:{'Content-Type':'application/json'}
  })
  if(!res.ok) throw new Error('delete product failed')
  return res.json()
}

export default function AdminProducts(){
  const [products, setProducts] = useState([])
  const [newProd, setNewProd] = useState({ codigo:'', nome:'' })
  const [editing, setEditing] = useState(null) // { codigo, nome }
  const { showModal } = useModal()

  // Carrega lista de produtos
  useEffect(()=>{
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(r=>r.json())
      .then(setProducts)
      .catch(()=>setProducts([]))
  }, [])

  // ---------- CREATE ----------
  async function handleAdd(){
    const { codigo, nome } = newProd
    if(!codigo || !nome){ alert('Preencha código e nome'); return }
    try{
      const created = await createProductApi({ codigo, nome })
      setProducts(prev=>[created, ...prev])
      setNewProd({ codigo:'', nome:'' })
      showModal({title:'Produto criado',body:`${created.nome} adicionado.`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao criar') }
  }

  // ---------- UPDATE ----------
  function startEdit(p){ setEditing({ codigo:p.codigo, nome:p.nome }) }
  async function handleUpdate(){
    if(!editing) return
    const { codigo, nome } = editing
    if(!nome){ alert('Nome obrigatório'); return }
    try{
      const updated = await updateProductApi(codigo, { nome })
      setProducts(prev=>prev.map(p=>p.codigo===codigo?updated:p))
      setEditing(null)
      showModal({title:'Produto atualizado',body:`${updated.nome}`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao atualizar') }
  }

  // ---------- DELETE ----------
  async function handleDelete(codigo){
    if(!window.confirm('Excluir este produto?')) return
    try{
      await deleteProductApi(codigo)
      setProducts(prev=>prev.filter(p=>p.codigo!==codigo))
      showModal({title:'Produto excluído',body:`Código ${codigo} removido.`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao excluir') }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Gerenciar Produtos (ADMIN)</h2>
      <div className="card p-4">
        {/* --- ADD FORM --- */}
        <h3 className="font-medium mb-2">Adicionar novo produto</h3>
        <div className="flex items-center gap-2 mb-4">
          <input placeholder="Código" className="border px-2 py-1 rounded w-24"
                 value={newProd.codigo}
                 onChange={e=>setNewProd(p=>({ ...p, codigo:e.target.value }))} />
          <input placeholder="Nome" className="border px-2 py-1 rounded w-48"
                 value={newProd.nome}
                 onChange={e=>setNewProd(p=>({ ...p, nome:e.target.value }))} />
          <button onClick={handleAdd} className="px-3 py-1 bg-primary text-white rounded">Adicionar</button>
        </div>

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
              {products.map(p=>(
                <tr key={p.codigo || p.ean} className="border-t">
                  <td className="p-2">{p.codigo}</td>
                  <td className="p-2">
                    {editing && editing.codigo===p.codigo ? (
                      <input className="border px-2 py-1 rounded w-48"
                             value={editing.nome}
                             onChange={e=>setEditing(ed=>({ ...ed, nome:e.target.value }))} />
                    ) : p.nome}
                  </td>
                  <td className="p-2">{p.active===false?'Inativo':'Ativo'}</td>
                  <td className="p-2 flex gap-2">
                    {editing && editing.codigo===p.codigo ? (
                      <>
                        <button onClick={handleUpdate}
                                className="px-2 py-1 bg-primary text-white rounded text-sm">Salvar</button>
                        <button onClick={()=>setEditing(null)}
                                className="px-2 py-1 border rounded text-sm">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>startEdit(p)}
                                className="px-2 py-1 border rounded text-sm">Editar</button>
                        <button onClick={()=>handleDelete(p.codigo)}
                                className="px-2 py-1 border rounded text-sm">Excluir</button>
                      </>
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
