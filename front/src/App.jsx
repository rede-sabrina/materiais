import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DashboardHome from './pages/DashboardHome'
import Reports from './pages/Reports'
import ReturnsList from './pages/ReturnsList'
import OrdersCreate from './pages/OrdersCreate'
import OrdersList from './pages/OrdersList'
import NewReturn from './pages/NewReturn'
import ReturnDetail from './pages/ReturnDetail'
import OrderDetail from './pages/OrderDetail'
import DashboardLayout from './layouts/DashboardLayout'
import SecretRegister from './pages/SecretRegister'
import AdminUsers from './pages/AdminUsers'
import AdminProducts from './pages/AdminProducts'
import FernandoDashboard from './pages/FernandoDashboard'
import FernandoOrdersList from './pages/FernandoOrdersList'
import StoreFernandoOrders from './pages/StoreFernandoOrders'
import DashboardRedirect from './pages/DashboardRedirect'
import FernandoReport from './pages/FernandoReport'

function getSessionRole() {
  try {
    const token = sessionStorage.getItem('token')
    if (!token) return null
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)).role || null
  } catch (e) {
    return null
  }
}

function RoleRoute({ roles, children }) {
  const role = getSessionRole()
  if (!role) return <Navigate to="/login" replace />
  if (!roles.includes(role)) return <Navigate to="/" replace />
  return children
}

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/secret-register" element={<SecretRegister/>} />
      <Route path="/" element={<DashboardLayout/>}>
        <Route index element={<DashboardRedirect/>} />
        <Route path="dashboard" element={<RoleRoute roles={['ADMIN', 'LOJA']}><DashboardHome/></RoleRoute>} />
        <Route path="reports" element={<RoleRoute roles={['ADMIN']}><Reports/></RoleRoute>} />

        <Route path="admin/users" element={<RoleRoute roles={['ADMIN']}><AdminUsers/></RoleRoute>} />
        <Route path="admin/produtos" element={<RoleRoute roles={['ADMIN']}><AdminProducts/></RoleRoute>} />
        <Route path="devolucoes" element={<RoleRoute roles={['ADMIN', 'LOJA']}><ReturnsList/></RoleRoute>} />
        <Route path="devolucoes/novo" element={<RoleRoute roles={['ADMIN', 'LOJA']}><NewReturn/></RoleRoute>} />
        <Route path="pedidos" element={<RoleRoute roles={['ADMIN', 'LOJA']}><OrdersList/></RoleRoute>} />
        <Route path="pedidos/novo" element={<RoleRoute roles={['ADMIN', 'LOJA']}><OrdersCreate/></RoleRoute>} />
        <Route path="devolucoes/:id" element={<RoleRoute roles={['ADMIN', 'LOJA']}><ReturnDetail/></RoleRoute>} />
        <Route path="pedidos/:id" element={<RoleRoute roles={['ADMIN', 'LOJA']}><OrderDetail/></RoleRoute>} />
        
        {/* Fernando routes */}
        <Route path="fernando" element={<RoleRoute roles={['FERNANDO', 'ADMIN']}><FernandoDashboard/></RoleRoute>} />
        <Route path="pedidos-fernando" element={<RoleRoute roles={['FERNANDO', 'ADMIN']}><FernandoOrdersList/></RoleRoute>} />
        <Route path="relatorio-fernando" element={<RoleRoute roles={['FERNANDO', 'ADMIN']}><FernandoReport/></RoleRoute>} />
        <Route path="pedidos-fernando-loja" element={<RoleRoute roles={['LOJA', 'ADMIN']}><StoreFernandoOrders/></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
