// storage.js — sincronización local + backend

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("authToken");
}

async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error("Usuario no autenticado");
  const headers = options.headers || {};
  headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = "application/json";
  return fetch(url, { ...options, headers });
}

// --- claves de almacenamiento ---
const STORAGE_KEYS = {
  fedexOrders: "fedexOrders",
  uspsOrders: "uspsOrders",
  retainedOrders: "retainedOrders",
  finishedGoods: "finishedGoods",
  materialsBOM: "materialsBOM",
  observations: "observations",
  partNumbers: "partNumbers",
  invoiceSearch: "invoiceSearch",
  invoiceHistory: "invoiceHistory",
  cutsReport: "cutsReport",
  dailyReport: "dailyReport",
};

// --- Helpers locales ---
export function saveLocalData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadLocalData(key, defaultValue = []) {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

// --- 🔁 Sincronización desde servidor ---
export async function syncDownload() {
  try {
    const res = await authFetch(`${API_URL}/api/sync/data`);
    if (!res.ok) throw new Error("Error en descarga");
    const data = await res.json();

    Object.entries(data).forEach(([key, value]) => {
      if (STORAGE_KEYS[key]) {
        saveLocalData(key, value);
      }
    });

    console.log("✅ Datos sincronizados (descargados)");
    return true;
  } catch (err) {
    console.error("❌ Error al sincronizar datos:", err);
    return false;
  }
}

// --- ⬆️ Subir todo al servidor ---
export async function syncUpload() {
  try {
    const payload = {};
    Object.values(STORAGE_KEYS).forEach((key) => {
      payload[key] = loadLocalData(key);
    });

    const res = await authFetch(`${API_URL}/api/sync/upload`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al subir datos");
    console.log("✅ Datos sincronizados (subidos)");
    return true;
  } catch (err) {
    console.error("❌ Error al subir datos:", err);
    return false;
  }
}

// --- Guardar automáticamente y sincronizar ---
export async function saveData(key, data, sync = true) {
  saveLocalData(key, data);
  if (sync) {
    await syncUpload();
  }
}

// --- Cargar datos locales (si no hay, intenta del backend) ---
export async function loadData(key) {
  let local = loadLocalData(key);
  if (!local || local.length === 0) {
    await syncDownload();
    local = loadLocalData(key);
  }
  return local;
}

// --- Sincronización automática al iniciar sesión ---
export async function initializeSync() {
  const token = getToken();
  if (!token) return;
  console.log("⏳ Iniciando sincronización automática...");
  await syncDownload();

  // Repetir sincronización cada 60 segundos
  setInterval(() => {
    syncUpload();
  }, 60000);
}

/**
 * 🔁 Inicializa la sincronización automática con backend al cargar la app
 */
export const initializeSync = async () => {
  console.log("🚀 Inicializando sincronización automática...");
  try {
    await syncStorageFromBackend();
    console.log("✅ Datos sincronizados correctamente al inicio.");
  } catch (err) {
    console.warn("⚠️ No se pudo sincronizar al inicio:", err);
  }
};