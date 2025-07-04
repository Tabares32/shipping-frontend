import React, { useState, useEffect } from 'react';
import { setStorage, getStorage } from '../utils/storage';

const AuthLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('normal'); // Default role for new users

  useEffect(() => {
    // Initialize default admin if no users exist
    const users = getStorage('users') || [];
    if (users.length === 0) {
      setStorage('users', [{ id: 'admin1', username: 'admin', password: 'adminpassword', role: 'admin' }]);
    }
  }, []);

  // No background image, using a clean, professional background
  const backgroundStyle = {
    backgroundColor: '#f0f2f5', // Light gray background
  };

  const handleLogin = () => {
    const users = getStorage('users') || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setStorage('currentUser', user);
      onLoginSuccess(user);
    } else {
      setError('Usuario o contraseña incorrectos. ¡Intenta de nuevo, campeón!');
      setMessage('');
    }
  };

  const handleRegister = () => {
    if (!username || !password) {
      setError('¡Nombre de usuario y contraseña son obligatorios!');
      setMessage('');
      return;
    }
    const users = getStorage('users') || [];
    if (users.some(u => u.username === username)) {
      setError('¡Ese nombre de usuario ya existe! Elige otro, por favor.');
      setMessage('');
      return;
    }
    const newUser = { id: Date.now().toString(), username, password, role };
    setStorage('users', [...users, newUser]);
    setStorage('currentUser', newUser);
    onLoginSuccess(newUser);
    setMessage('¡Usuario registrado y sesión iniciada con éxito!');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={backgroundStyle}>
      <div className="bg-white bg-opacity-90 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {isRegistering ? 'Registrar Usuario' : 'Iniciar Sesión'}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
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
        {isRegistering && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Usuario</label>
            <select
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all duration-300"
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
          className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-lg font-semibold shadow-lg mb-4"
        >
          {isRegistering ? 'Registrar y Entrar' : 'Entrar'}
        </button>
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setMessage('');
          }}
          className="w-full text-blue-600 py-2 hover:underline transition-colors duration-300"
        >
          {isRegistering ? 'Ya tengo cuenta, Iniciar Sesión' : '¿No tienes cuenta? Registrar Usuario'}
        </button>
      </div>
    </div>
  );
};

export default AuthLogin;