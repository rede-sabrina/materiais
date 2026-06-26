export function parseJwt(token){
  try{
    if(!token) return null
    const parts = token.split('.')
    if(parts.length < 2) return null
    const payload = parts[1]
    const b = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(b).split('').map(c=> '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(json)
  } catch(e){ return null }
}

export function getReminderStorageKeys(token){
  const user = parseJwt(token)
  const userKey = user && (user.username || user.id) ? String(user.username || user.id) : 'anon'
  return {
    userKey,
    stateKey: `notifications_state_${userKey}`,
    countKey: `reminders_count_${userKey}`
  }
}

export function loadReminderState(stateKey){
  try{
    const raw = sessionStorage.getItem(stateKey)
    if(raw) return JSON.parse(raw)
  } catch(e){}
  return { done: [], dismissed: [] }
}

export function buildNotifications(items, isAdmin){
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const isCollected = (status) => {
    const s = (status || '').toLowerCase()
    return s === 'coletado' || s === 'concluido' || s === 'concluído'
  }
  const keyFor = (it) => String(it._id || it.id || it.nota || JSON.stringify(it))
  return (items || []).flatMap(it=>{
    const raw = it.createdAt || it.data || it.date
    if(!raw) return []
    const d = new Date(raw)
    if(isNaN(d)) return []
    const ageDays = Math.floor((now - d.getTime()) / dayMs)
    const base = {
      returnId: keyFor(it),
      nota: it.nota || 'Sem nota',
      loja: it.loja || '—'
    }
    const notices = []
    const missingNfd = !it.nfdNumber && !it.nfdDate
    if(missingNfd && ageDays >= 2){
      notices.push({
        ...base,
        id: `nfd_missing:${base.returnId}`,
        type: 'nfd_missing',
        title: `NFD pendente ha ${ageDays} dias`,
        subtitle: `Nota ${base.nota} - Loja ${base.loja}`
      })
    }
    if(ageDays >= 7 && !isCollected(it.status)){
      notices.push({
        ...base,
        id: `no_collection:${base.returnId}`,
        type: 'no_collection',
        title: `Sem coleta ha ${ageDays} dias`,
        subtitle: `Nota ${base.nota} - Loja ${base.loja}`
      })
    }
    return notices
  })
}

export function saveReminderCount(countKey, list, state){
  const count = (list || []).filter(n => !(state?.done || []).includes(n.id)).length
  try{ sessionStorage.setItem(countKey, String(count)) } catch(e){}
  try{ window.dispatchEvent(new CustomEvent('reminders-count', { detail: { key: countKey, count } })) } catch(e){}
}
