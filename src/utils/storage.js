// src/utils/storage.js
// ✅ Totalmente compatible con React, guarda y sincroniza datos entre usuarios

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// --- Lectura con fallback remoto ---
export const getStorage = (key) => {
  try {
    // 1️⃣ Intentar leer desde localStorage
    const storedValue = localStorage.getItem(key);
    if (storedValue) return JSON.parse(storedValue);

    // 2️⃣ Si no hay nada local, intentar obtenerlo del backend (sin bloquear UI)
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${BACKEND}/api/storage/${key}`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.value !== undefined && data.value !== null) {
            localStorage.setItem(key, JSON.stringify(data.value));
            console.log(`✅ Datos sincronizados desde backend (${key})`);
          }
        })
        .catch((e) => console.warn("Backend storage fetch error:", e));
    }

    return null;
  } catch (e) {
    console.error("Error leyendo storage:", e);
    return null;
  }
};

// --- Escritura sincronizada (local + backend) ---
export const setStorage = (key, value) => {
  try {
    // Guardar localmente primero
    localStorage.setItem(key, JSON.stringify(value));

    // Si hay token, también guardar en backend (no bloquea la app)
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${BACKEND}/api/storage/${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ value }),
      }).catch((e) => console.warn("Backend storage save error:", e));
    }
  } catch (e) {
    console.error("Error guardando en storage:", e);
  }
};

// --- Inicialización segura ---
export const createStorage = (key, defaultValue) => {
  const existing = getStorage(key);
  if (existing === null) {
    setStorage(key, defaultValue);
    return defaultValue;
  }
  return existing;
};

// --- Seguridad ---
export function saveCredentials() {
  console.warn("Guardado de credenciales desactivado por seguridad.");
}