import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DashboardHome from './pages/DashboardHome'
import Reports from './pages/Reports'
import ReturnsList from './pages/ReturnsList'
import OrdersCreate from './pages/OrdersCreate'
import NewReturn from './pages/NewReturn'
import ReturnDetail from './pages/ReturnDetail'
import DashboardLayout from './layouts/DashboardLayout'
import SecretRegister from './pages/SecretRegister'
import AdminUsers from './pages/AdminUsers'
import AdminProducts from './pages/AdminProducts'
import Reminders from './pages/Reminders'


export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/secret-register" element={<SecretRegister/>} />
      <Route path="/" element={<DashboardLayout/>}>
        <Route index element={<DashboardHome/>} />
        <Route path="lembretes" element={<Reminders/>} />
        <Route path="reports" element={<Reports/>} />

        <Route path="admin/users" element={<AdminUsers/>} />
          <Route path="admin/produtos" element={<AdminProducts/>} />
        <Route path="devolucoes" element={<ReturnsList/>} />
        <Route path="devolucoes/novo" element={<NewReturn/>} />
          <Route path="pedidos/novo" element={<OrdersCreate/>} />
        <Route path="devolucoes/:id" element={<ReturnDetail/>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
