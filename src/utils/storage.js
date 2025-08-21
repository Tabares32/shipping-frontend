const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function fetchStorage(key) {
  try {
    const res = await fetch(`${API_URL}/api/storage/${encodeURIComponent(key)}`);
    const data = await res.json();
    return data?.value ?? null;
  } catch (e) {
    return null;
  }
}

async function persistStorage(key, value) {
  try {
    await fetch(`${API_URL}/api/storage/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  } catch (e) {
    // ignore network errors; localStorage still works
  }
}

export const createStorage = (key, defaultValue) => {
  const local = localStorage.getItem(key);
  if (local === null) {
    // set default immediately for UI responsiveness
    localStorage.setItem(key, JSON.stringify(defaultValue));
    // in background, try to hydrate from server; if server has a value, prefer it
    fetchStorage(key).then(serverValue => {
      if (serverValue !== null) {
        localStorage.setItem(key, JSON.stringify(serverValue));
        try {
          const evt = new CustomEvent('remoteStorageUpdate', { detail: { type: 'storage_update', key, value: serverValue } });
          window.dispatchEvent(evt);
        } catch {}
      } else {
        // push default to server if not exists
        persistStorage(key, defaultValue);
      }
    });
    return defaultValue;
  }
  return JSON.parse(local);
};

export const getStorage = (key) => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : null;
};

export const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  // push to server and broadcast via WS
  persistStorage(key, value);
  try {
    import('./realtime').then(m => m.sendStorageUpdate && m.sendStorageUpdate(key, value));
  } catch {}
};
