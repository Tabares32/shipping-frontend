import React, { useEffect, useState } from 'react'
import { apiFetch } from '../api.js'
import { getToken } from '../auth.js'

export default function Reports() {
  const token = getToken()
  const [reports, setReports] = useState([])
  const [form, setForm] = useState({ title:'', content_json:'{}' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await apiFetch('/reports', { token })
      setReports(data)
    } catch(e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(()=>{ load(); const id = setInterval(load, 5000); return ()=>clearInterval(id) }, [])

  async function createReport(e) {
    e.preventDefault()
    try {
      // Validar JSON
      JSON.parse(form.content_json)
      await apiFetch('/reports', { method:'POST', token, body: form })
      setForm({ title:'', content_json:'{}' })
      load()
    } catch(e) { alert(e.message) }
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Reportes</h2>
        {loading? <p>Cargando...</p> : error? <p className="error">{error}</p> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Título</th><th>Creado por</th><th>Fecha</th></tr></thead>
            <tbody>
              {reports.map(r=> (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.created_by || '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card print-area">
        <h2>Crear reporte</h2>
        <form className="form" onSubmit={createReport}>
          <label>Título
            <input value={form.title} onChange={e=>setForm(s=>({...s, title:e.target.value}))} required />
          </label>
          <label>Contenido (JSON)
            <textarea rows="10" value={form.content_json} onChange={e=>setForm(s=>({...s, content_json:e.target.value}))} />
          </label>
          <button className="btn">Guardar</button>
        </form>

        <h3>Vista previa</h3>
        <pre className="preview">
{(() => { try { return JSON.stringify(JSON.parse(form.content_json), null, 2) } catch { return 'JSON inválido' }})()}
        </pre>
        <button className="btn" onClick={()=>window.print()}>Imprimir</button>
      </div>
    </div>
  )
}
