// src/utils/storage.js
// ✅ Compatible con React y no rompe componentes existentes

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// --- Funciones síncronas (no rompen .filter(), .map(), etc.) ---
export const getStorage = (key) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (e) {
    console.error("Error leyendo storage:", e);
    return null;
  }
};

export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    // 🔄 Guardar también en backend si hay token (no bloquea la app)
    const token = localStorage.getItem("token");
    if (token) {
      // Se hace de forma no bloqueante
      fetch(`${BACKEND}/api/storage/${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ value }),
      }).catch((e) => console.warn("Backend storage error:", e));
    }
  } catch (e) {
    console.error("Error guardando en storage:", e);
  }
};

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