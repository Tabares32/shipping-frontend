import React, { useState } from 'react';
import { setStorage } from '../utils/storage';

const API_URL = process.env.REACT_APP_API_URL || 'https://shipping-backend-c0q1.onrender.com';

const AuthLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('normal');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setStorage('currentUser', data.user);
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Error de inicio de sesión.');
      }
    } catch (err) {
      setError('Error de conexión al servidor.');
    }
  };

  const handleRegister = async () => {
    if (!username || !password) {
      setError('¡Nombre de usuario y contraseña son obligatorios!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      const data = await response.json();
      if (response.ok) {
        setStorage('currentUser', data.user);
        onLoginSuccess(data.user);
        setMessage('¡Usuario registrado y sesión iniciada!');
      } else {
        setError(data.error || 'Error al registrar.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8">
          {isRegistering ? 'Registrar Usuario' : 'Iniciar Sesión'}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        <input
          type="text"
          placeholder="Usuario"
          className="w-full px-5 py-3 mb-4 border border-gray-300 rounded-xl"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-5 py-3 mb-6 border border-gray-300 rounded-xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isRegistering && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Usuario</label>
            <select
              className="w-full px-5 py-3 border border-gray-300 rounded-xl"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        )}
        <button
          onClick={isRegistering ? handleRegister : handleLogin}
          className="w-full bg-black text-white py-3 rounded-xl mb-4"
        >
          {isRegistering ? 'Registrar y Entrar' : 'Entrar'}
        </button>
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setMessage('');
          }}
          className="w-full text-blue-600 py-2 hover:underline"
        >
          {isRegistering ? 'Ya tengo cuenta, Iniciar Sesión' : '¿No tienes cuenta? Registrar Usuario'}
        </button>
      </div>
    </div>
  );
};

export default AuthLogin;