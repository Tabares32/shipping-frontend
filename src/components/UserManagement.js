import React, { useState, useEffect } from "react";

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 🚀 Cargar usuarios reales del backend
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("No se pudo obtener la lista de usuarios");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar usuarios desde el servidor.");
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    setError("");
    setMessage("");

    if (!newUsername || !newPassword) {
      setError("¡Nombre de usuario y contraseña son obligatorios!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Debes iniciar sesión antes de crear usuarios.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al crear usuario");

      setUsers([...users, { id: data.user.id, username: newUsername, role: "user" }]);
      setMessage("¡Usuario agregado con éxito!");
      setNewUsername("");
      setNewPassword("");
    } catch (e) {
      console.error(e);
      setError(e.message);
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
          Agregar Nuevo Usuario
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Usuario"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleAddUser}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
        >
          Agregar Usuario
        </button>
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
            </tr>
          </thead>
          <tbody>
            {users.length ? (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4">{u.username}</td>
                  <td className="py-3 px-4">{u.role}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-gray-500 py-4">
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