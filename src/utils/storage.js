// utils/storage.js
export const getStorage = async (key) => {
  const token = localStorage.getItem("token");
  const BACKEND =
    process.env.REACT_APP_BACKEND_URL ||
    "https://shipping-backend-kgm5.onrender.com";

  if (token) {
    try {
      const res = await fetch(`${BACKEND}/api/storage/${key}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      return data?.value || null;
    } catch (err) {
      console.error("Error al obtener desde backend:", err);
    }
  }

  // Fallback local si no hay token o error
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

export const setStorage = async (key, value) => {
  const token = localStorage.getItem("token");
  const BACKEND =
    process.env.REACT_APP_BACKEND_URL ||
    "https://shipping-backend-kgm5.onrender.com";

  // Guardar en backend si hay token
  if (token) {
    try {
      await fetch(`${BACKEND}/api/storage/${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ value }),
      });
    } catch (err) {
      console.error("Error al guardar en backend:", err);
    }
  }

  // Siempre guardar también localmente (por rendimiento)
  localStorage.setItem(key, JSON.stringify(value));
};