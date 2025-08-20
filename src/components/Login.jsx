import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api.js'
import { saveAuth } from '../auth.js'

export default function Login() {
  const [emailOrUser, setEmailOrUser] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // El backend acepta email o username
      const payload = emailOrUser.includes('@') ? { email: emailOrUser } : { username: emailOrUser }
      const data = await apiFetch('/login', { method:'POST', body: { ...payload, password } })
      saveAuth(data.token, data.user)
      navigate('/orders')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-center">
      <h2>Iniciar sesión</h2>
      <form onSubmit={onSubmit} className="form">
        <label>Usuario o Email
          <input value={emailOrUser} onChange={e=>setEmailOrUser(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p className="muted">Si el registro está cerrado, solicita a un admin tu usuario.</p>
    </div>
  )
}
