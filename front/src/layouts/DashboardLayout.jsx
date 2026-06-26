import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function DashboardLayout(){
  const navigate = useNavigate()
  useEffect(()=>{
    const token = sessionStorage.getItem('token')
    if(!token){
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6 bg-slate-50 h-full overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
