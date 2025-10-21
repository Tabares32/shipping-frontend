import React, { useState, useEffect } from "react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const BACKEND =
    process.env.REACT_APP_BACKEND_URL ||
    "https://shipping-backend-kgm5.onrender.com";

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  // 🔹 Cargar lista de usuarios
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔹 Crear nuevo usuario
  const handleCreateUser = async () => {
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Completa todos los campos");
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "No se pudo crear usuario en el backend");
        return;
      }

      setSuccess(`Usuario "${username}" creado correctamente ✅`);
      setUsername("");
      setPassword("");
      fetchUsers();
    } catch (err) {
      console.error("Error creando usuario:", err);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Gestión de Usuarios
      </h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      {/* Formulario de creación */}
      <div className="mb-6 bg-gray-50 p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-3">Agregar usuario</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Usuario"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleCreateUser}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-white font-semibold transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Creando..." : "Agregar"}
          </button>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Usuarios registrados
        </h3>
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">ID</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3 capitalize">{u.role}</td>
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