import React, { useEffect, useState } from 'react'
import { fetchReturns } from '../services/api'
import { buildNotifications, getReminderStorageKeys, loadReminderState, parseJwt, saveReminderCount } from '../utils/reminders'

export default function Reminders(){
  const [notifications, setNotifications] = useState([])
  const [notifState, setNotifState] = useState({ done: [], dismissed: [] })

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
  const user = parseJwt(token)
  const isAdmin = user && user.role === 'ADMIN'
  const { stateKey: notifStorageKey, countKey: countStorageKey } = getReminderStorageKeys(token)

  function loadNotifState(){
    return loadReminderState(notifStorageKey)
  }

  function saveNotifState(next){
    setNotifState(next)
    try{ sessionStorage.setItem(notifStorageKey, JSON.stringify(next)) } catch(e){}
  }

  async function load(){
    try{
      const items = await fetchReturns()
      const list = buildNotifications(items, isAdmin)
      const state = loadNotifState()
      const filteredList = list.filter(n => !state.dismissed.includes(n.id))
      setNotifications(filteredList)
      saveReminderCount(countStorageKey, filteredList, state)
    } catch(e){ console.error(e) }
  }

  useEffect(()=>{
    saveNotifState(loadNotifState())
    load()
  }, [])

  function toggleDone(id){
    const next = {
      ...notifState,
      done: notifState.done.includes(id)
        ? notifState.done.filter(x=>x !== id)
        : [...notifState.done, id]
    }
    saveNotifState(next)
    saveReminderCount(countStorageKey, notifications, next)
  }

  function dismissNotif(id){
    const next = {
      ...notifState,
      dismissed: notifState.dismissed.includes(id)
        ? notifState.dismissed
        : [...notifState.dismissed, id]
    }
    saveNotifState(next)
    setNotifications(prev=> {
      const updated = prev.filter(n=> n.id !== id)
      saveReminderCount(countStorageKey, updated, next)
      return updated
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Lembretes</h2>
        <div className="text-sm text-slate-500">{notifications.length} ativos</div>
      </div>
      <div className="bg-white p-4 rounded shadow-sm">
        {notifications.length === 0 ? (
          <div className="text-sm text-slate-500">Sem lembretes pendentes.</div>
        ) : (
          <div className="divide-y">
            {notifications.map(n=>{
              const checked = notifState.done.includes(n.id)
              return (
                <div key={n.id} className={`flex items-start justify-between py-3 ${checked ? 'bg-slate-50' : ''}`}>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=>toggleDone(n.id)}
                    />
                    <div>
                      <div className={`font-medium ${checked ? 'line-through text-slate-400' : ''}`}>{n.title}</div>
                      <div className="text-sm text-slate-500">{n.subtitle}</div>
                    </div>
                  </label>
                  <button className="text-sm text-slate-500 hover:text-slate-900" onClick={()=>dismissNotif(n.id)}>Excluir</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
