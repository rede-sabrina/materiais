import React from 'react'

const colorMap = {
  Pendente: 'bg-slate-200 text-slate-800',
  Solicitado: 'bg-[#7CB77F]/20 text-[#7CB77F]',
  'Em análise': 'bg-blue-100 text-blue-800',
  'Coleta agendada': 'bg-orange-100 text-orange-800',
  Coletado: 'bg-violet-100 text-violet-800',
  Concluído: 'bg-[#047857]/20 text-[#047857]',
  Cancelado: 'bg-slate-200 text-slate-700',
  Cancelada: 'bg-slate-200 text-slate-700',
  Recusado: 'bg-red-100 text-red-800',
  Negado: 'bg-red-100 text-red-800'
}

export default function Badge({children}){
  return <span className={`px-2 py-1 rounded-full text-sm ${colorMap[children]||'bg-slate-100'}`}>{children}</span>
}
