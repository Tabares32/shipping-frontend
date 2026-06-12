/**
 * storage.js — Capa de datos
 * Lee/escribe en MongoDB via API. localStorage solo como caché local.
 */

export const BACKEND =
  process.env.REACT_APP_BACKEND_URL ||
  "https://shipping-backend-kgm5.onrender.com";

// ── Caché local ────────────────────────────────────────────────────────────────
export function getStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function setStorage(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

function getToken() {
  return localStorage.getItem("authToken");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${getToken()}`,
  };
}

// ── Rol del usuario actual ─────────────────────────────────────────────────────
export function getCurrentRole() {
  try {
    const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return u.role || "viewer";
  } catch {
    return "viewer";
  }
}

export function canEdit() {
  return ["admin", "editor"].includes(getCurrentRole());
}

// ── Sync completo desde MongoDB ────────────────────────────────────────────────
export async function syncFromBackend() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${BACKEND}/api/sync/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { console.warn("syncFromBackend:", res.status); return; }
    const data = await res.json();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        setStorage(key, value);
      }
    });
    console.log("✅ syncFromBackend completado");
  } catch (err) {
    console.error("❌ syncFromBackend:", err);
  }
}

// ── Push de datos locales al backend ──────────────────────────────────────────
export async function syncToBackend() {
  const token = getToken();
  if (!token || !canEdit()) return;

  const keys = [
    "fedex_orders","usps_orders","retained_orders","finished_goods",
    "material_bom","observations","part_numbers","invoice_search",
    "invoice_history","cuts_report","daily_report",
  ];
  const payload = {};
  for (const k of keys) {
    const v = getStorage(k);
    if (Array.isArray(v) && v.length > 0) payload[k] = v;
  }
  try {
    const res = await fetch(`${BACKEND}/api/sync/upload`, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(payload),
    });
    if (!res.ok) console.error("syncToBackend error:", await res.text());
    else console.log("✅ syncToBackend OK");
  } catch (err) {
    console.error("❌ syncToBackend:", err);
  }
}

// ── Init sync tras login ───────────────────────────────────────────────────────
export async function initStorageSync(token) {
  localStorage.setItem("authToken", token);
  await syncFromBackend();
}

export function clearSyncState() {
  localStorage.removeItem("syncDone");
}

// ── API helpers genéricos ───────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(`${BACKEND}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
  return res.json();
}

// ── USPS orders ────────────────────────────────────────────────────────────────
export const uspsApi = {
  list:   ()        => apiGet("/api/usps_orders"),
  create: (record)  => apiPost("/api/usps_orders", record),
  update: (id, rec) => apiPut(`/api/usps_orders/${id}`, rec),
  remove: (id)      => apiDelete(`/api/usps_orders/${id}`),
};

// ── FedEx orders ───────────────────────────────────────────────────────────────
export const fedexApi = {
  list:   ()        => apiGet("/api/fedex_orders"),
  create: (record)  => apiPost("/api/fedex_orders", record),
  update: (id, rec) => apiPut(`/api/fedex_orders/${id}`, rec),
  remove: (id)      => apiDelete(`/api/fedex_orders/${id}`),
};

// ── Retained orders ────────────────────────────────────────────────────────────
export const retainedApi = {
  list:   ()        => apiGet("/api/retained_orders"),
  create: (record)  => apiPost("/api/retained_orders", record),
  update: (id, rec) => apiPut(`/api/retained_orders/${id}`, rec),
  remove: (id)      => apiDelete(`/api/retained_orders/${id}`),
};

// ── Finished goods ─────────────────────────────────────────────────────────────
export const finishedGoodsApi = {
  list:   ()        => apiGet("/api/finished_goods"),
  create: (record)  => apiPost("/api/finished_goods", record),
  update: (id, rec) => apiPut(`/api/finished_goods/${id}`, rec),
  remove: (id)      => apiDelete(`/api/finished_goods/${id}`),
};

// ── Observations ───────────────────────────────────────────────────────────────
export const observationsApi = {
  list:   ()       => apiGet("/api/observations"),
  create: (record) => apiPost("/api/observations", record),
  update: (id, rec)=> apiPut(`/api/observations/${id}`, rec),
  remove: (id)     => apiDelete(`/api/observations/${id}`),
};

// ── Material BOM ───────────────────────────────────────────────────────────────
export const materialBomApi = {
  list:   ()        => apiGet("/api/material_bom"),
  create: (record)  => apiPost("/api/material_bom", record),
  update: (id, rec) => apiPut(`/api/material_bom/${id}`, rec),
  remove: (id)      => apiDelete(`/api/material_bom/${id}`),
};
