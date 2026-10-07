import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DashboardRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    function parseJwt(token) {
      try {
        if (!token) return null
        const parts = token.split('.')
        if (parts.length < 2) return null
        const payload = parts[1]
        const b = payload.replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(atob(b).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
        return JSON.parse(json)
      } catch (e) { return null }
    }

    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
    const user = parseJwt(token)
    
    if (user?.role === 'FERNANDO') {
      navigate('/fernando', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return <div className="p-8 text-center text-gray-500">Redirecionando...</div>
}