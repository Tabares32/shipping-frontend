import React, { useState, useEffect } from "react";
import { setStorage, getStorage } from "../utils/storage";
import { initStorageSync } from "./storage";

async function handleLogin() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Credenciales inválidas");

  const data = await res.json();
  localStorage.setItem("authToken", data.token);
  await initStorageSync(data.token); // 🔹 Arranca sincronización global

  navigate("/dashboard"); // o tu ruta principal
}

const AuthLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const BACKEND =
    process.env.REACT_APP_BACKEND_URL ||
    "https://shipping-backend-kgm5.onrender.com";

  // Crear usuario admin local si no hay ninguno
  useEffect(() => {
    const users = getStorage("users") || [];
    if (users.length === 0) {
      setStorage("users", [
        {
          id: "admin1",
          username: "admin",
          password: "adminpassword",
          role: "admin",
        },
      ]);
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    setMessage("");

    if (!username || !password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND.replace(/\/$/, "")}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.detail || "Error al iniciar sesión");
        return;
      }

      const token = data.access_token || data.token;
      if (!token) {
        setError("El servidor no devolvió un token");
        return;
      }

      // Guardar token y usuario en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          username: data.username || username,
          role: data.role || "user",
        })
      );

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

  const backgroundStyle = {
    backgroundColor: "#f0f2f5",
  };

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