// src/utils/storage.js
const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// Cargar datos desde el backend
export async function syncFromBackend() {
  const res = await fetch(`${BACKEND}/api/sync/data`);
  const data = await res.json();
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}

// Subir datos al backend
export async function syncToBackend() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.warn("❌ No hay token para sincronizar");
    return;
  }

  const data = {};
  for (const key of Object.keys(localStorage)) {
    if (key === "authToken" || key === "currentUser") continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      data[key] = localStorage.getItem(key);
    }
  }

  try {
    const res = await fetch(`${BACKEND}/api/sync/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("❌ Error durante sincronización:", result);
    } else {
      console.log("✅ Datos sincronizados:", result);
    }
  } catch (err) {
    console.error("❌ Error de red al sincronizar:", err);
  }
}

// Inicializar sincronización al iniciar sesión
export async function initStorageSync(token) {
  localStorage.setItem("authToken", token);
  await syncFromBackend();
}

// Guardar datos en localStorage
export function setStorage(key, value) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}