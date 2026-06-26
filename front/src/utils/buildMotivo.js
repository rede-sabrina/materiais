export function buildMotivo(items){
  const reasons = Array.from(
    new Set(
      (items || [])
        .map(i => (i.motivo || '').trim())
        .filter(Boolean)
    )
  )

  if(reasons.length === 0) return 'Conforme itens'

  return reasons.join(' / ')
}