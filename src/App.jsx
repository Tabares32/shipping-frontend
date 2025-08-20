import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Login from './components/Login.jsx'
import Orders from './components/Orders.jsx'
import OrderDetail from './components/OrderDetail.jsx'
import Reports from './components/Reports.jsx'
import { getToken, clearAuth, getUser } from './auth.js'

function NavBar() {
  const navigate = useNavigate()
  const user = getUser()
  return (
    <nav className="nav">
      <div className="brand">📦 Shipping</div>
      {getToken() && (
        <>
          <Link to="/orders">Órdenes</Link>
          <Link to="/reports">Reportes</Link>
          <span className="spacer" />
          <span className="user">👤 {user?.username} ({user?.role})</span>
          <button className="btn" onClick={() => { clearAuth(); navigate('/login') }}>Salir</button>
        </>
      )}
    </nav>
  )
}

function Protected({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <div className="content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<Protected><Orders /></Protected>} />
          <Route path="/orders/:id" element={<Protected><OrderDetail /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="*" element={<Navigate to={getToken()? '/orders' : '/login'} replace />} />
        </Routes>
      </div>
    </div>
  )
}
