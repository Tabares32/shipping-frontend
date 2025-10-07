import React, { useState, useEffect } from 'react';
import { setStorage, getStorage } from '../utils/storage';

const AuthLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('Christian Tabares');
  const [password, setPassword] = useState('Shipping3');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://shipping-backend-kgm5.onrender.com';

  useEffect(() => {
    // Initialize default admin if no users exist
    const users = getStorage('users') || [];
    if (users.length === 0) {
      setStorage('users', [{ id: 'admin1', username: 'admin', password: 'adminpassword', role: 'admin' }]);
    }
  }, []);

  const backgroundStyle = {
    backgroundColor: '#f0f2f5',
  };

  const handleLogin = async () => {
    setError('');
    setMessage('');

    if (!BACKEND) {
      setError('Backend URL no configurado');
      return;
    }

    try {
      const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Usuario o contraseña incorrectos' }));
        setError(err.detail || 'Usuario o contraseña incorrectos');
        return;
      }

      const data = await res.json();
      setStorage('authToken', data.token);
      setStorage('currentUser', { username: data.username, role: data.role });

      onLoginSuccess && onLoginSuccess({ username: data.username, role: data.role });

      // Redirigir al dashboard
      setTimeout(() => {
  window.location.href = '/';
}, 100);
    } catch (e) {
      console.error(e);
      setError('Error de red. Verifica la conexión con el backend.');
    }
  };

  const handleRegister = () => {
    setError('El registro de nuevos usuarios solo puede ser realizado por un administrador.');
    setMessage('');
  };

  return (
<form
  onSubmit={(e) => {
    e.preventDefault();
    handleLogin();
  }}
>
  <input
    type="text"
    placeholder="Usuario"
    className="w-full px-5 py-3 mb-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all duration-300"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
  />
  <input
    type="password"
    placeholder="Contraseña"
    className="w-full px-5 py-3 mb-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all duration-300"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <button
    type="submit"
    className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-lg font-semibold shadow-lg mb-4"
  >
    Entrar
  </button>
</form>

export default AuthLogin;