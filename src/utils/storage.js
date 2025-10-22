// src/utils/storage.js
// Manejo universal de almacenamiento (local + backend opcional)

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// ✅ Lee un valor del storage (usa backend si hay token)
export const getStorage = async (key) => {
  try {
    const token = localStorage.getItem("token");

    if (token) {
      const res = await fetch(`${BACKEND}/api/storage/${key}`, {
        headers: { Authorization: "Bearer " + token },
      });

      if (res.ok) {
        const data = await res.json();
        return data?.value || null;
      }
    }

    // Fallback local
    const localValue = localStorage.getItem(key);
    return localValue ? JSON.parse(localValue) : null;
  } catch (e) {
    console.error("Error leyendo storage:", e);
    return null;
  }
};

// ✅ Guarda un valor (usa backend + localStorage)
export const setStorage = async (key, value) => {
  try {
    const token = localStorage.getItem("token");

    // Guardar local siempre
    localStorage.setItem(key, JSON.stringify(value));

    // Guardar en backend si el usuario está logueado
    if (token) {
      await fetch(`${BACKEND}/api/storage/${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ value }),
      });
    }
  } catch (e) {
    console.error("Error guardando storage:", e);
  }
};

// ✅ Crear una clave con valor por defecto si no existe
export const createStorage = async (key, defaultValue) => {
  const existing = await getStorage(key);
  if (existing === null) {
    await setStorage(key, defaultValue);
    return defaultValue;
  }
  return existing;
};

// ❌ Desactivamos guardado de credenciales directas
export function saveCredentials() {
  console.warn("Guardado de credenciales desactivado por seguridad.");
}