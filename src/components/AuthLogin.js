// ✅ src/components/AuthLogin.js
import React, { useState, useEffect } from "react";
import { initStorageSync } from "../utils/storage";

const AuthLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const BACKEND =
    process.env.REACT_APP_BACKEND_URL ||
    "https://shipping-backend-kgm5.onrender.com";

  const handleLogin = async () => {
    setError("");
    setMessage("");

    if (!username || !password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }

    try {
      const response = await fetch(`${BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.detail || "Error al iniciar sesión");
        return;
      }

      const token = data.token || data.access_token;
      if (!token) {
        setError("El servidor no devolvió un token");
        return;
      }

      // 🧠 Guardar sesión local
      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          username: data.username || username,
          role: data.role || "user",
        })
      );

      // 🔄 Iniciar sincronización global
      await initStorageSync(token);

      setMessage("Inicio de sesión exitoso 🎉");
      setTimeout(() => {
        if (onLoginSuccess)
          onLoginSuccess({
            username: data.username || username,
            role: data.role || "user",
          });
      }, 800);
    } catch (err) {
      console.error("Error de login:", err);
      setError("Error de conexión con el servidor");
    }
  };

  const backgroundStyle = { backgroundColor: "#f0f2f5" };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={backgroundStyle}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Iniciar Sesión
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

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 text-lg font-semibold shadow-lg mb-4"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};

export default AuthLogin;