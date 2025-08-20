const API_URL = import.meta.env.VITE_API_URL || 'https://shipping-backend-kgm5.onrender.com/api'

export async function apiFetch(path, { method='GET', body=null, token=null, params=null } = {}) {
  const url = new URL(path, API_URL)
  if (params) Object.entries(params).forEach(([k,v]) => (v!==undefined && v!==null && v!=='') && url.searchParams.append(k, v))
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }
  if (!res.ok) throw new Error(data?.error || 'Error de API')
  return data
}
