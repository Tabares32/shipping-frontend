const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

/**
 * ✅ Leer datos desde localStorage con JSON.parse seguro
 */
export function getStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

/**
 * ✅ Guardar datos en localStorage
 */
export function setStorage(key, value) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * ✅ Cargar datos desde el backend (.json) y guardarlos en localStorage
 */
export async function syncFromBackend() {
  try {
    const res = await fetch(`${BACKEND}/api/sync/data`);
    const data = await res.json();

    Object.entries(data).forEach(([key, value]) => {
      setStorage(key, value);
    });

    console.log("✅ Datos cargados desde el backend");
  } catch (err) {
    console.error("❌ Error al cargar datos del backend:", err);
  }
}

/**
 * ✅ Subir datos locales al backend para sincronizar con los archivos .json
 */
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
      console.log("✅ Datos sincronizados con el backend:", result);
    }
  } catch (err) {
    console.error("❌ Error de red al sincronizar:", err);
  }
}

/**
 * ✅ Inicializar sesión y sincronización al iniciar sesión
 */
export async function initStorageSync(token) {
  localStorage.setItem("authToken", token);
  await syncFromBackend();
}