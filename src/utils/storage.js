// src/utils/storage.js
// ✅ Sincroniza datos entre usuarios (global), mantiene localStorage actualizado

const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// --- Leer local + iniciar sincronización remota ---
export const getStorage = (key) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) return JSON.parse(storedValue);

    // Si no hay local, iniciar carga remota
    syncStorageFromBackend(key);
    return null;
  } catch (e) {
    console.error("Error leyendo storage:", e);
    return null;
  }
};

// --- Guardar local + backend ---
export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
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

// --- Crear clave por defecto ---
export const createStorage = (key, defaultValue) => {
  const existing = getStorage(key);
  if (existing === null) {
    setStorage(key, defaultValue);
    return defaultValue;
  }
  return existing;
};

// --- Sincronización global manual/automática ---
export const syncStorageFromBackend = async (key = null) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // Si se pide un solo key
    if (key) {
      const res = await fetch(`${BACKEND}/api/storage/${key}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data?.value !== undefined && data?.value !== null) {
        localStorage.setItem(key, JSON.stringify(data.value));
      }
      return;
    }

    // Si no se pasa key, obtener todas las claves conocidas
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith("BOM") || k.startsWith("FG") || k.startsWith("INV")) {
        const res = await fetch(`${BACKEND}/api/storage/${k}`, {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await res.json();
        if (data?.value !== undefined && data?.value !== null) {
          localStorage.setItem(k, JSON.stringify(data.value));
        }
      }
    }
    console.log("🔄 Datos sincronizados desde backend.");
  } catch (e) {
    console.warn("Error sincronizando datos desde backend:", e);
  }
};

// --- Seguridad ---
export function saveCredentials() {
  console.warn("Guardado de credenciales desactivado por seguridad.");
}