const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

export function getStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function setStorage(key, value) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Descarga los datos del backend y los guarda en localStorage.
 * Requiere token válido — nunca expone contraseñas (el backend las filtra).
 */
export async function syncFromBackend() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND}/api/sync/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn("⚠️ syncFromBackend: respuesta no OK", res.status);
      return;
    }
    const data = await res.json();

    Object.entries(data).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;
      if (value.length > 0) {
        setStorage(key, value);
      } else {
        const local = getStorage(key);
        if (!Array.isArray(local) || local.length === 0) {
          console.warn(`⚠️ ${key}: vacío en backend y sin copia local`);
        }
      }
    });
    console.log("✅ syncFromBackend completado");
  } catch (err) {
    console.error("❌ syncFromBackend error:", err);
  }
}

/**
 * Sube datos locales al backend.
 */
export async function syncToBackend() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.warn("❌ syncToBackend: sin token");
    return;
  }

  const keysToSync = [
    "material_bom",
    "observations",
    "finished_goods",
    "part_numbers",
    "fedex_orders",
    "usps_orders",
    "retained_orders",
    "invoice_history",
    "invoice_search",
    "daily_report",
    "cuts_report",
  ];

  const payload = {};
  for (const key of keysToSync) {
    const val = getStorage(key);
    if (Array.isArray(val) && val.length > 0) {
      payload[key] = val;
    }
  }

  try {
    const res = await fetch(`${BACKEND}/api/sync/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("❌ syncToBackend error:", result);
    } else {
      console.log("✅ syncToBackend OK:", result);
    }
  } catch (err) {
    console.error("❌ syncToBackend error de red:", err);
  }
}

/**
 * Inicializa la sincronización al iniciar sesión.
 * Solo descarga una vez por sesión.
 */
export async function initStorageSync(token) {
  localStorage.setItem("authToken", token);
  if (!localStorage.getItem("syncDone")) {
    await syncFromBackend();
    localStorage.setItem("syncDone", "true");
  }
}

/** Limpia la marca de sincronización al cerrar sesión. */
export function clearSyncState() {
  localStorage.removeItem("syncDone");
}
