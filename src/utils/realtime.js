let ws;
let listeners = [];

export function connectRealtime(apiUrl) {
  const wsUrl = apiUrl.replace(/^http/, 'ws') + '/api/ws';
  if (ws && ws.readyState === WebSocket.OPEN) return ws;
  ws = new WebSocket(wsUrl);
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg?.type === 'storage_update') {
        // Update localStorage and notify app
        localStorage.setItem(msg.key, JSON.stringify(msg.value));
        const evt = new CustomEvent('remoteStorageUpdate', { detail: msg });
        window.dispatchEvent(evt);
      }
    } catch (e) {
      // ignore
    }
  };
  ws.onclose = () => {
    // retry after a while
    setTimeout(() => connectRealtime(apiUrl), 2000);
  };
  return ws;
}

export function sendStorageUpdate(key, value) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'storage_update', key, value }));
}

export function addRealtimeListener(cb) {
  listeners.push(cb);
  const handler = (e) => cb(e.detail);
  window.addEventListener('remoteStorageUpdate', handler);
  return () => window.removeEventListener('remoteStorageUpdate', handler);
}
