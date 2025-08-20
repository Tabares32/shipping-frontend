import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api.js'
import { getToken } from '../auth.js'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = getToken()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [lineForm, setLineForm] = useState({ part_number:'', description:'', quantity:1, unit_price:0 })

  async function load() {
    try {
      const data = await apiFetch(`/orders/${id}`, { token })
      setOrder(data)
    } catch(e) { setErr(e.message) } finally { setLoading(false) }
  }
  useEffect(()=>{ load(); const idt = setInterval(load, 5000); return ()=>clearInterval(idt) }, [id])

  async function updateOrder(patch) {
    try { await apiFetch(`/orders/${id}`, { method:'PATCH', token, body: patch }); load() } catch(e){ alert(e.message) }
  }
  async function deleteOrder() {
    if (!confirm('¿Eliminar orden?')) return
    try { await apiFetch(`/orders/${id}`, { method:'DELETE', token }); navigate('/orders') } catch(e){ alert(e.message) }
  }
  async function addLine(e) {
    e.preventDefault()
    try { await apiFetch(`/orders/${id}/lines`, { method:'POST', token, body: lineForm }); setLineForm({part_number:'',description:'',quantity:1,unit_price:0}); load() } catch(e){ alert(e.message) }
  }
  async function updateLine(lid, patch) {
    try { await apiFetch(`/lines/${lid}`, { method:'PATCH', token, body: patch }); load() } catch(e){ alert(e.message) }
  }
  async function deleteLine(lid) {
    if (!confirm('¿Eliminar línea?')) return
    try { await apiFetch(`/lines/${lid}`, { method:'DELETE', token }); load() } catch(e){ alert(e.message) }
  }

  const total = useMemo(()=> {
    if (!order) return 0
    return order.lines.reduce((sum, l)=> sum + (Number(l.quantity)||0) * (parseFloat(l.unit_price)||0), 0)
  }, [order])

  if (loading) return <p>Cargando...</p>
  if (err) return <p className="error">{err}</p>
  if (!order) return <p>No encontrado</p>

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Orden #{order.id}</h2>
        <div className="form inline-grid">
          <label>Factura
            <input value={order.invoice||''} onChange={e=>setOrder(o=>({...o, invoice:e.target.value}))} onBlur={e=>updateOrder({invoice:e.target.value})} />
          </label>
          <label>Cliente
            <input value={order.client||''} onChange={e=>setOrder(o=>({...o, client:e.target.value}))} onBlur={e=>updateOrder({client:e.target.value})} />
          </label>
          <label>Fecha
            <input type="date" value={order.date||''} onChange={e=>setOrder(o=>({...o, date:e.target.value}))} onBlur={e=>updateOrder({date:e.target.value||null})} />
          </label>
          <label>Estatus
            <select value={order.status} onChange={e=>{ setOrder(o=>({...o, status:e.target.value})); updateOrder({status:e.target.value}) }}>
              <option value="open">open</option>
              <option value="closed">closed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
        </div>

        <h3>Líneas</h3>
        <table className="table">
          <thead><tr><th>Parte</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Importe</th><th></th></tr></thead>
          <tbody>
            {order.lines.map(l => (
              <tr key={l.id}>
                <td><input value={l.part_number} onChange={e=>updateLine(l.id, {part_number:e.target.value})} /></td>
                <td><input value={l.description||''} onChange={e=>updateLine(l.id, {description:e.target.value})} /></td>
                <td><input type="number" min="1" value={l.quantity} onChange={e=>updateLine(l.id, {quantity:Number(e.target.value)})} /></td>
                <td><input type="number" step="0.01" value={l.unit_price} onChange={e=>updateLine(l.id, {unit_price:e.target.value})} /></td>
                <td>{((Number(l.quantity)||0) * (parseFloat(l.unit_price)||0)).toFixed(2)}</td>
                <td><button className="btn btn-danger" onClick={()=>deleteLine(l.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan="4" style={{textAlign:'right'}}>Total</td><td colSpan="2"><b>{total.toFixed(2)}</b></td></tr>
          </tfoot>
        </table>

        <form className="form compact" onSubmit={addLine}>
          <input placeholder="Parte *" value={lineForm.part_number} onChange={e=>setLineForm(s=>({...s, part_number:e.target.value}))} required />
          <input placeholder="Descripción" value={lineForm.description} onChange={e=>setLineForm(s=>({...s, description:e.target.value}))} />
          <input type="number" min="1" placeholder="Cant." value={lineForm.quantity} onChange={e=>setLineForm(s=>({...s, quantity:Number(e.target.value)}))} />
          <input type="number" step="0.01" placeholder="Precio" value={lineForm.unit_price} onChange={e=>setLineForm(s=>({...s, unit_price:e.target.value}))} />
          <button className="btn">Añadir</button>
        </form>

        <div className="actions">
          <button className="btn btn-danger" onClick={deleteOrder}>Eliminar orden</button>
        </div>
      </div>

      <div className="card print-area" id="print-order">
        <h2>Resumen para imprimir</h2>
        <div><b>Factura:</b> {order.invoice} &nbsp; | &nbsp; <b>Cliente:</b> {order.client || '-'}</div>
        <div><b>Fecha:</b> {order.date || '-'}</div>
        <table className="table print">
          <thead><tr><th>Parte</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
          <tbody>
            {order.lines.map(l => (
              <tr key={l.id}>
                <td>{l.part_number}</td>
                <td>{l.description||''}</td>
                <td>{l.quantity}</td>
                <td>{l.unit_price}</td>
                <td>{((Number(l.quantity)||0) * (parseFloat(l.unit_price)||0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan="4" style={{textAlign:'right'}}>Total</td><td><b>{total.toFixed(2)}</b></td></tr></tfoot>
        </table>
        <button className="btn" onClick={()=>window.print()}>Imprimir</button>
      </div>
    </div>
  )
}
