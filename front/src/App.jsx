import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DashboardHome from './pages/DashboardHome'
import Reports from './pages/Reports'
import ReturnsList from './pages/ReturnsList'
import NewReturn from './pages/NewReturn'
import ReturnDetail from './pages/ReturnDetail'
import DashboardLayout from './layouts/DashboardLayout'
import SecretRegister from './pages/SecretRegister'
import AdminUsers from './pages/AdminUsers'
import Reminders from './pages/Reminders'
import AuditLog from './pages/AuditLog'

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/secret-register" element={<SecretRegister/>} />
      <Route path="/" element={<DashboardLayout/>}>
        <Route index element={<DashboardHome/>} />
        <Route path="lembretes" element={<Reminders/>} />
        <Route path="reports" element={<Reports/>} />
        <Route path="auditoria" element={<AuditLog/>} />
        <Route path="admin/users" element={<AdminUsers/>} />
        <Route path="devolucoes" element={<ReturnsList/>} />
        <Route path="devolucoes/novo" element={<NewReturn/>} />
        <Route path="devolucoes/:id" element={<ReturnDetail/>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
