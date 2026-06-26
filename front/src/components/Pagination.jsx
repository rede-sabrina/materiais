import React from 'react'

export default function Pagination({page, totalPages, onPageChange}){
  return (
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 border rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={()=>onPageChange(Math.max(1,page-1))}>Anterior</button>
        <div className="text-sm">Página {page} de {totalPages}</div>
        <button className="px-3 py-1 border rounded transition transform hover:-translate-y-1 hover:scale-105" onClick={()=>onPageChange(Math.min(totalPages,page+1))}>Próxima</button>
      </div>
  )
}
