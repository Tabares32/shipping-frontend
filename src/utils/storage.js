// storage.js
const API_URL = "https://shipping-backend-kgm5.onrender.com/api";
let authToken = null;

// Inicializa sincronización
export async function initStorageSync(token) {
  console.log("🚀 Inicializando sincronización automática...");
  authToken = token;

  try {
    await syncFromBackend();
    console.log("✅ Sincronización inicial completada");
  } catch (err) {
    console.warn("⚠️ No se pudo sincronizar al inicio:", err);
  }

  // Sincroniza cada 30 segundos automáticamente
  setInterval(() => {
    syncToBackend();
  }, 30000);
}

// 🔹 Descarga todos los datos del backend
export async function syncFromBackend() {
  console.log("🌐 Iniciando sincronización desde backend:", API_URL);
  const res = await fetch(`${API_URL}/sync/data`);
  if (!res.ok) throw new Error(`Backend respondió con ${res.status}`);
  const data = await res.json();
  localStorage.setItem("shippingData", JSON.stringify(data));
  return data;
}

// 🔹 Sube todos los datos locales al backend
export async function syncToBackend() {
  if (!authToken) return;
  try {
    const raw = localStorage.getItem("shippingData");
    if (!raw) return;
    const data = JSON.parse(raw);

    const res = await fetch(`${API_URL}/sync/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Error durante sincronización:", errText);
    } else {
      console.log("☁️ Datos sincronizados correctamente con backend");
    }
  } catch (err) {
    console.error("⚠️ Error subiendo datos:", err);
  }
}

// 🔹 Guarda datos en localStorage y lanza sincronización inmediata
export function saveData(key, value) {
  const raw = localStorage.getItem("shippingData");
  const data = raw ? JSON.parse(raw) : {};
  data[key] = value;
  localStorage.setItem("shippingData", JSON.stringify(data));
  syncToBackend(); // sube inmediatamente al backend
}

// 🔹 Obtiene datos locales
export function getData(key) {
  const raw = localStorage.getItem("shippingData");
  const data = raw ? JSON.parse(raw) : {};
  return data[key] || [];
}