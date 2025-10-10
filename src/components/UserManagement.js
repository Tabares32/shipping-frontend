import React, { useEffect, useState } from 'react';
import { getStorage } from '../utils/storage';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://shipping-backend-kgm5.onrender.com';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const token = getStorage('authToken');

  // Cargar lista de usuarios del backend
  const fetchUsers = async () => {
    setError('');
    try {
      const res = await fetch(`${BACKEND}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error cargando usuarios desde el servidor.');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error obteniendo usuarios:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Agregar nuevo usuario
  const handleAddUser = async () => {
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');
    setMessage('');

    try {
      const res = await fetch(`${BACKEND}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al crear usuario.');
      }

      setMessage('Usuario agregado correctamente.');
      setUsername('');
      setPassword('');
      setRole('member');
      fetchUsers(); // refrescar lista
    } catch (err) {
      console.error('Error creando usuario:', err);
      setError(err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Usuarios</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}

      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Agregar Nuevo Usuario</h3>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Usuario"
            className="border px-4 py-2 rounded-lg"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="border px-4 py-2 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="border px-4 py-2 rounded-lg"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="member">Miembro</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            onClick={handleAddUser}
            className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-all"
          >
            Agregar Usuario
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Usuarios Registrados</h3>
        {users.length === 0 ? (
          <p className="text-gray-500">No hay usuarios registrados.</p>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Usuario</th>
                <th className="py-2 px-4 border">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 px-4 border">{u.username}</td>
                  <td className="py-2 px-4 border capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;