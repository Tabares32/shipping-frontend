import React, { useState, useEffect } from "react";
import { getStorage, setStorage } from "../utils/storage";

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

const UserManagement = () => {
  const [users,      setUsers]      = useState([]);
  const [username,   setUsername]   = useState("");
  const [password,   setPassword]   = useState("");
  const [role,       setRole]       = useState("user");
  const [editingId,  setEditingId]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const token       = localStorage.getItem("authToken");
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  })();

  if (currentUser?.role !== "admin") {
    return (
      <div className="p-8 text-red-500 font-semibold">
        Acceso denegado: solo administradores.
      </div>
    );
  }

  // ── Cargar usuarios ─────────────────────────────────────────
  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${BACKEND}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        setError(data.detail || "No tienes permisos.");
        setUsers(getStorage("users") || []);
        return;
      }
      setUsers(data);
      setStorage("users", data);
    } catch {
      setError("Error de conexión.");
      setUsers(getStorage("users") || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  // ── Crear / Actualizar ──────────────────────────────────────
  const handleSave = async () => {
    setError("");
    if (!username.trim()) { setError("Escribe un nombre de usuario."); return; }
    if (!editingId && !password) { setError("La contraseña es obligatoria."); return; }

    const payload = { username: username.trim(), role };
    if (password) payload.password = password;

    const url    = editingId ? `${BACKEND}/api/users/${editingId}` : `${BACKEND}/api/users`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.detail || "No se pudo guardar."); return; }

      showSuccess(editingId ? "Usuario actualizado ✅" : `Usuario "${username}" creado ✅`);
      setUsername(""); setPassword(""); setRole("user"); setEditingId(null);
      await fetchUsers();
    } catch {
      setError("Error de conexión.");
    }
  };

  // ── Eliminar ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este usuario permanentemente?")) return;
    setError("");
    try {
      const res  = await fetch(`${BACKEND}/api/users/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.detail || "No se pudo eliminar."); return; }
      showSuccess("Usuario eliminado ✅");
      await fetchUsers();
    } catch {
      setError("Error de conexión.");
    }
  };

  const startEdit = (user) => {
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setEditingId(user.id);
  };

  const cancelEdit = () => {
    setUsername(""); setPassword(""); setRole("user"); setEditingId(null); setError("");
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="p-8 overflow-auto flex-1">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Usuarios</h2>

      {error   && <p className="text-red-500   mb-4 bg-red-50   border border-red-200   rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-green-700 mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{success}</p>}

      {/* Formulario */}
      <div className="mb-8 bg-gray-50 p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          {editingId ? "✏️ Editar usuario" : "➕ Nuevo usuario"}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Nombre de usuario"
            className="flex-1 min-w-[180px] border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder={editingId ? "Nueva contraseña (dejar vacío = no cambiar)" : "Contraseña"}
            className="flex-1 min-w-[180px] border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-white font-semibold transition-colors ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Guardando…" : editingId ? "Actualizar" : "Agregar"}
          </button>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Usuarios registrados</h3>
        </div>
        {loading ? (
          <p className="p-6 text-gray-500">Cargando…</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Rol</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Proveedor</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-xs text-gray-400 font-mono">{u.id}</td>
                  <td className="p-4 font-medium text-gray-800">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {u.role === "admin" ? "Admin" : "Usuario"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 capitalize">
                    {u.auth_provider || "local"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      {u.auth_provider !== "google" && (
                        <button
                          onClick={() => startEdit(u)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
