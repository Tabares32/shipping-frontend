// src/utils/storage.js
const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Guarda un valor en localStorage de forma segura
 */
export const setStorage = (key, value) => {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`❌ Error al guardar en localStorage (${key}):`, error);
  }
};

/**
 * Obtiene un valor de localStorage de forma segura
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`❌ Error al leer de localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Limpia completamente el almacenamiento local
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('❌ Error al limpiar localStorage:', error);
  }
};

/**
 * 🔄 Sincroniza datos locales con el backend
 * Descarga toda la información global (BOM, Finished Goods, etc.)
 * y la almacena en localStorage para todos los usuarios.
 */
export const syncStorageFromBackend = async () => {
  if (!BACKEND) {
    console.warn("⚠️ No se definió REACT_APP_BACKEND_URL — sincronización omitida.");
    return;
  }

  console.log("🌐 Iniciando sincronización desde backend:", BACKEND);

  try {
    const response = await fetch(`${BACKEND}/api/sync/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend respondió con ${response.status}`);
    }

    const data = await response.json();

    // Guardar cada grupo de datos en localStorage
    if (data?.bom) setStorage('bomData', data.bom);
    if (data?.finishedGoods) setStorage('finishedGoodsData', data.finishedGoods);
    if (data?.inventory) setStorage('inventoryData', data.inventory);
    if (data?.users) setStorage('users', data.users);

    console.log("✅ Sincronización completada exitosamente.");
    return data;
  } catch (error) {
    console.error("❌ Error durante la sincronización desde backend:", error);
    throw error;
  }
};

/**
 * 🔼 (Opcional) Enviar datos locales al backend si quieres sincronizar subida
 */
export const syncStorageToBackend = async () => {
  if (!BACKEND) return;

  const bomData = getStorage('bomData', []);
  const finishedGoods = getStorage('finishedGoodsData', []);
  const inventory = getStorage('inventoryData', []);
  const users = getStorage('users', []);

  try {
    const response = await fetch(`${BACKEND}/api/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bom: bomData,
        finishedGoods,
        inventory,
        users,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error del backend: ${response.status}`);
    }

    console.log("📤 Datos locales enviados al backend correctamente.");
  } catch (error) {
    console.error("❌ Error al subir datos al backend:", error);
  }
};

/**
 * 💾 Guarda datos personalizados (por ejemplo, órdenes FedEx)
 */
export const saveData = (key, data) => {
  try {
    setStorage(key, data);
    console.log(`💾 Datos guardados en '${key}' correctamente.`);
  } catch (error) {
    console.error(`❌ Error al guardar datos en '${key}':`, error);
  }
};

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