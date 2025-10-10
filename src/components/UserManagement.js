import React, { useState, useEffect } from "react";
import { getStorage, setStorage } from "../utils/storage";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "https://shipping-backend-kgm5.onrender.com";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("normal");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  // 🔹 Cargar usuarios locales al iniciar
  useEffect(() => {
    const storedUsers = getStorage("users") || [];
    setUsers(storedUsers);
  }, []);

  // 🔹 Guardar usuarios en localStorage
  const saveLocalUsers = (updated) => {
    setStorage("users", updated);
    setUsers(updated);
  };

  // 🔹 Crear usuario en backend + guardar localmente
  const handleAddUser = async () => {
    setError("");
    setMessage("");

    if (!newUsername || !newPassword) {
      setError("¡Nombre de usuario y contraseña son obligatorios!");
      return;
    }

    if (users.some((u) => u.username === newUsername)) {
      setError("¡Ese nombre de usuario ya existe!");
      return;
    }

    try {
      // Recupera el token guardado al hacer login
const token = localStorage.getItem("token");

const res = await fetch(`${BACKEND}/api/users`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  },
  body: JSON.stringify({ username: newUsername, password: newPassword }),
});

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al crear usuario en el servidor");
      }

      // Usuario creado correctamente en el backend
      const newUser = {
        id: Date.now().toString(),
        username: newUsername,
        password: newPassword,
        role: newRole,
      };
      const updated = [...users, newUser];
      saveLocalUsers(updated);
      setMessage("¡Usuario agregado con éxito!");
      setNewUsername("");
      setNewPassword("");
      setNewRole("normal");
    } catch (e) {
      console.error("Error creando usuario:", e);
      setError("No se pudo crear usuario en el backend.");
    }
  };

  const handleEditClick = (user) => setEditingUser({ ...user });
  const handleCancelEdit = () => setEditingUser(null);

  const handleSaveEdit = () => {
    if (!editingUser.username || !editingUser.password) {
      setError("¡Nombre de usuario y contraseña no pueden estar vacíos!");
      return;
    }
    const updated = users.map((u) =>
      u.id === editingUser.id ? editingUser : u
    );
    saveLocalUsers(updated);
    setEditingUser(null);
    setMessage("¡Usuario actualizado con éxito!");
  };

  const handleRemoveUser = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      const updated = users.filter((u) => u.id !== id);
      saveLocalUsers(updated);
      setMessage("Usuario eliminado correctamente.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Gestión de Usuarios
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {message && <p className="text-green-600 text-center mb-4">{message}</p>}

      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          {editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Usuario"
            value={editingUser ? editingUser.username : newUsername}
            onChange={(e) =>
              editingUser
                ? setEditingUser({ ...editingUser, username: e.target.value })
                : setNewUsername(e.target.value)
            }
            disabled={!!editingUser}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={editingUser ? editingUser.password : newPassword}
            onChange={(e) =>
              editingUser
                ? setEditingUser({ ...editingUser, password: e.target.value })
                : setNewPassword(e.target.value)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
          />
          <select
            value={editingUser ? editingUser.role : newRole}
            onChange={(e) =>
              editingUser
                ? setEditingUser({ ...editingUser, role: e.target.value })
                : setNewRole(e.target.value)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black md:col-span-2"
          >
            <option value="normal">Normal</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {editingUser ? (
          <div className="flex justify-end gap-4">
            <button
              onClick={handleSaveEdit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Guardar Cambios
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddUser}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
          >
            Agregar Usuario
          </button>
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Usuarios Existentes
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                Usuario
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                Rol
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length ? (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4">{u.username}</td>
                  <td className="py-3 px-4">{u.role}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemoveUser(u.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="text-center text-gray-500 py-4"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;