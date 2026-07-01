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

async function deactivateProductApi(codigo){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${codigo}`,{
    method:'PATCH',
    headers:{'Content-Type':'application/json'}
  })
  if(!res.ok) throw new Error('deactivate product failed')
  return res.json()
}

async function activateProductApi(codigo){
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${codigo}/activate`,{
    method:'PATCH',
    headers:{'Content-Type':'application/json'}
  })
  if(!res.ok) throw new Error('activate product failed')
  return res.json()
}

export default function AdminProducts(){
  const PER_PAGE = 15
  const [products, setProducts] = useState([])
  const [newProd, setNewProd] = useState({ nome:'' })
  const [editing, setEditing] = useState(null) // { codigo, nome }
  const [page, setPage] = useState(1)
  const { showModal } = useModal()

  // Carrega lista de produtos
  function loadProducts(){
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(r=>r.json())
      .then(setProducts)
      .catch(()=>setProducts([]))
  }

  useEffect(()=>{
    loadProducts()
  }, [])

  // ---------- CREATE ----------
  async function handleAdd(){
    const { nome } = newProd
    if(!nome){ alert('Preencha o nome do produto'); return }
    const numericCodes = products.map(p=>parseInt(p.codigo,10)).filter(n=>!isNaN(n))
    const maxCode = numericCodes.length ? Math.max(...numericCodes) : 0
    const nextCode = String(maxCode + 1).padStart(2, '0')
    try{
      await createProductApi({ codigo: nextCode, nome })
      loadProducts()
      setNewProd({ nome:'' })
      showModal({title:'Produto criado',body:`${nome} adicionado com código ${nextCode}.`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao criar') }
  }

  // ---------- UPDATE ----------
  function startEdit(p){ setEditing({ codigo:p.codigo, nome:p.nome }) }
  async function handleUpdate(){
    if(!editing) return
    const { codigo, nome } = editing
    if(!nome){ alert('Nome obrigatório'); return }
    try{
      await updateProductApi(codigo, { nome })
      loadProducts()
      setEditing(null)
      showModal({title:'Produto atualizado',body:`${nome}`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao atualizar') }
  }

  // ---------- DELETE ----------
  async function handleDelete(codigo){
    showModal({
      title: 'Confirmar exclusão',
      body: 'Deseja realmente excluir este produto?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        showModal({title:'Excluindo', loading:true, hideActions:true})
        try{
          await deleteProductApi(codigo)
          loadProducts()
          showModal({title:'Produto excluído', body:`Código ${codigo} removido.`, confirmLabel:'Fechar'})
        }catch(e){
          console.error(e)
          showModal({title:'Erro', body:'Não foi possível excluir o produto.', confirmLabel:'Fechar'})
        }
      }
    })
  }

  // ---------- ACTIVATE / DEACTIVATE ----------
  async function handleDeactivate(codigo){
    try{
      await deactivateProductApi(codigo)
      loadProducts()
      showModal({title:'Produto desativado',body:`Código ${codigo} marcado como inativo.`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao desativar') }
  }

  async function handleActivate(codigo){
    try{
      await activateProductApi(codigo)
      loadProducts()
      showModal({title:'Produto ativado',body:`Código ${codigo} está em estoque.`,confirmLabel:'Fechar'})
    }catch(e){ console.error(e); alert('Erro ao ativar') }
  }

  // ---------- PAGINAÇÃO ----------
  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE))
  const pageItems = products.slice((page-1)*PER_PAGE, page*PER_PAGE)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Gerenciar Produtos (ADMIN)</h2>
      <div className="card p-4">
        {/* ADIÇÃO */}
        <h3 className="font-medium mb-2">Adicionar novo produto</h3>
<div className="flex items-center gap-2 mb-4">
           <input placeholder="Nome" className="border px-2 py-1 rounded w-48"
                  value={newProd.nome}
                  onChange={e=>setNewProd(p=>({ ...p, nome:e.target.value }))} />
           <button onClick={handleAdd}
                   className="px-3 py-1 bg-primary text-white rounded">Adicionar</button>
         </div>

        <hr className="my-6" />
        <h3 className="font-medium mb-2">Produtos cadastrados (página {page}/{totalPages})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
<thead>
               <tr className="bg-slate-100 text-sm text-slate-700">
                 <th className="p-2">Nome</th>
                 <th className="p-2">Status</th>
                 <th className="p-2">Ações</th>
               </tr>
             </thead>
<tbody>
               {pageItems.map(p=>(
                 <tr key={p.codigo || p.ean} className="border-t">
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
                                 className="px-2 py-1 bg-primary text-white rounded text-sm">Editar</button>
                         {p.active!==false && (
                           <button onClick={()=>handleDeactivate(p.codigo)}
                                   className="px-2 py-1 bg-red-600 text-white rounded text-sm">Desativar</button>
                         )}
                         {p.active===false && (
                           <button onClick={()=>handleActivate(p.codigo)}
                                   className="px-2 py-1 bg-green-600 text-white rounded text-sm">Ativar</button>
                         )}
                         <button onClick={()=>handleDelete(p.codigo)}
                                 className="px-2 py-1 bg-red-600 text-white rounded text-sm">Excluir</button>
                       </>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        <div className="flex justify-between mt-4">
          <button disabled={page===1}
                  onClick={()=>setPage(p=>Math.max(1,p-1))}
                  className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <span className="self-center">Página {page} de {totalPages}</span>
          <button disabled={page===totalPages}
                  onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                  className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
        </div>
      </div>
    </div>
  )
}
