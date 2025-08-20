import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api.js'
import { getToken } from '../auth.js'

export default function Orders() {
  const token = getToken()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ invoice:'', client:'', date:'', status:'open' })
  const [filters, setFilters] = useState({ client:'', status:'' })

  async function load() {
    try {
      const data = await apiFetch('/orders', { token, params: filters })
      setOrders(data)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(()=>{ load(); const id = setInterval(load, 5000); return ()=>clearInterval(id) }, [filters])

  async function createOrder(e) {
    e.preventDefault()
    try {
      await apiFetch('/orders', { method:'POST', token, body: form })
      setForm({ invoice:'', client:'', date:'', status:'open' })
      load()
    } catch (e) { alert(e.message) }
  }

  const totalOpen = useMemo(()=> orders.filter(o=>o.status==='open').length, [orders])

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Órdenes</h2>
        <div className="filters">
          <input placeholder="Filtrar cliente..." value={filters.client} onChange={e=>setFilters(s=>({...s, client:e.target.value}))} />
          <select value={filters.status} onChange={e=>setFilters(s=>({...s, status:e.target.value}))}>
            <option value="">Todos</option>
            <option value="open">Abiertas</option>
            <option value="closed">Cerradas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        {loading? <p>Cargando...</p> : err? <p className="error">{err}</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Factura</th><th>Cliente</th><th>Fecha</th><th>Estatus</th><th>Líneas</th><th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o=> (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.invoice}</td>
                  <td>{o.client || '-'}</td>
                  <td>{o.date || '-'}</td>
                  <td><span className={"badge "+o.status}>{o.status}</span></td>
                  <td>{o.line_count}</td>
                  <td><Link className="btn" to={`/orders/${o.id}`}>Abrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="muted">Abiertas: {totalOpen}</div>
      </div>
      <div className="card">
        <h2>Nueva Orden</h2>
        <form className="form" onSubmit={createOrder}>
          <label>Factura
            <input value={form.invoice} onChange={e=>setForm(s=>({...s, invoice:e.target.value}))} required />
          </label>
          <label>Cliente
            <input value={form.client} onChange={e=>setForm(s=>({...s, client:e.target.value}))} />
          </label>
          <label>Fecha
            <input type="date" value={form.date} onChange={e=>setForm(s=>({...s, date:e.target.value}))} />
          </label>
          <label>Estatus
            <select value={form.status} onChange={e=>setForm(s=>({...s, status:e.target.value}))}>
              <option value="open">open</option>
              <option value="closed">closed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <button className="btn">Crear</button>
        </form>
      </div>
    </div>
  )
}
