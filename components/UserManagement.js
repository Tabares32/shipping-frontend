import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/storage';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('normal');
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null); // User being edited

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const storedUsers = getStorage('users') || [];
    setUsers(storedUsers);
  };

  const handleAddUser = () => {
    if (!newUsername || !newPassword) {
      setMessage('¡Nombre de usuario y contraseña son obligatorios!');
      return;
    }
    if (users.some(u => u.username === newUsername)) {
      setMessage('¡Ese nombre de usuario ya existe! Elige otro, por favor.');
      return;
    }

    const newUser = { id: Date.now().toString(), username: newUsername, password: newPassword, role: newRole };
    const updatedUsers = [...users, newUser];
    setStorage('users', updatedUsers);
    setUsers(updatedUsers);
    setMessage('¡Usuario agregado con éxito!');
    setNewUsername('');
    setNewPassword('');
    setNewRole('normal');
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user }); // Copy user to editing state
    setMessage('');
  };

  const handleSaveEdit = () => {
    if (!editingUser.username || !editingUser.password) {
      setMessage('¡Nombre de usuario y contraseña no pueden estar vacíos!');
      return;
    }
    const updatedUsers = users.map(user =>
      user.id === editingUser.id ? editingUser : user
    );
    setStorage('users', updatedUsers);
    setUsers(updatedUsers);
    setMessage('¡Usuario actualizado con éxito!');
    setEditingUser(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setMessage('');
  };

  const handleRemoveUser = (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setStorage('users', updatedUsers);
      setUsers(updatedUsers);
      setMessage('¡Usuario eliminado con éxito!');
    }
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
              disabled={!!editingUser} // Disable username edit for existing users
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
            <button
              onClick={handleSaveEdit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 text-md font-semibold shadow-md"
            >
              Guardar Cambios
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-300 text-md font-semibold shadow-md"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddUser}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300 text-md font-semibold shadow-md"
          >
            Agregar Usuario
          </button>
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
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4 text-gray-800">{user.username}</td>
                  <td className="py-3 px-4 text-gray-800">{user.role}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors duration-300 text-sm mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-300 text-sm"
                    >
                      Eliminar
                    </button>
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