// Use 127.0.0.1 (not "localhost") so the browser always connects over IPv4,
// matching the backend which binds to 127.0.0.1:8000. "localhost" can resolve to
// IPv6 (::1) in Chrome, where nothing is listening → "Cannot reach the API server".
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const TOKEN_KEY = 'bput_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the API server. Is the backend running on port 8000?')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (res.status === 401) {
    clearToken()
    if (path !== '/api/auth/login') {
      throw new Error('Your session expired. Please sign in again.')
    }
  }

  if (!res.ok) {
    const detail = data?.detail
    // FastAPI validation errors arrive as a list of objects.
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(', ')
      : detail || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}

export const getHealth = () => api.get('/api/health')
