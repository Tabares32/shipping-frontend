// src/utils/storage.js
// Limpieza: no se guardan credenciales de usuario en localStorage

// Obtener un valor almacenado (JSON.parse)
export const getStorage = (key) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (e) {
    console.error("Error leyendo storage:", e);
    return null;
  }
};

// Guardar un valor (JSON.stringify)
export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error guardando en storage:", e);
  }
};

// Crear una clave con valor por defecto (solo si no existe)
export const createStorage = (key, defaultValue) => {
  const existing = getStorage(key);
  if (existing === null) {
    setStorage(key, defaultValue);
    return defaultValue;
  }
  return existing;
};

// Desactivar cualquier guardado de credenciales explícito
export function saveCredentials() {
  console.warn("Guardado de credenciales desactivado por seguridad.");
}