import React, { useState, useEffect } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://shipping-backend-kgm5.onrender.com';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('normal');
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/users`);
      if (!res.ok) throw new Error('No se pudieron obtener los usuarios.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setMessage('Error cargando usuarios desde el servidor.');
    }
  };

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) {
      setMessage('¡Nombre de usuario y contraseña son obligatorios!');
      return;
    }

    try {
      const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.detail || 'Error al registrar usuario.');
        return;
      }

      setMessage('¡Usuario agregado con éxito!');
      setNewUsername('');
      setNewPassword('');
      setNewRole('normal');
      loadUsers();
    } catch (err) {
      console.error(err);
      setMessage('Error al conectar con el servidor.');
    }
  };

  const handleRemoveUser = async (username) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/users/${username}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        setMessage('No se pudo eliminar el usuario.');
        return;
      }

      setMessage('Usuario eliminado con éxito.');
      loadUsers();
    } catch (err) {
      console.error(err);
      setMessage('Error al conectar con el servidor.');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setMessage('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser.username || !editingUser.password) {
      setMessage('¡Nombre de usuario y contraseña no pueden estar vacíos!');
      return;
    }

    try {
      const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/users/${editingUser.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      if (!res.ok) throw new Error('No se pudo actualizar el usuario.');

      setMessage('¡Usuario actualizado con éxito!');
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      setMessage('Error al conectar con el servidor.');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setMessage('');
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gestión de Usuarios</h2>
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Usuario</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              value={editingUser ? editingUser.username : newUsername}
              onChange={(e) => editingUser ? setEditingUser({ ...editingUser, username: e.target.value }) : setNewUsername(e.target.value)}
              disabled={!!editingUser}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              value={editingUser ? editingUser.password : newPassword}
              onChange={(e) => editingUser ? setEditingUser({ ...editingUser, password: e.target.value }) : setNewPassword(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Rol</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              value={editingUser ? editingUser.role : newRole}
              onChange={(e) => editingUser ? setEditingUser({ ...editingUser, role: e.target.value }) : setNewRole(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        {editingUser ? (
          <div className="flex justify-end space-x-4">
            <button onClick={handleSaveEdit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Guardar</button>
            <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
          </div>
        ) : (
          <button onClick={handleAddUser} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">Agregar Usuario</button>
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">Usuarios Existentes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Usuario</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Rol</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.username} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 text-gray-800">{user.username}</td>
                  <td className="py-3 px-4 text-gray-800">{user.role}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleEditClick(user)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 mr-2">Editar</button>
                    <button onClick={() => handleRemoveUser(user.username)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-500">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
