import { api, clearToken, setToken } from './api'

export async function login(email, password) {
  const data = await api.post('/api/auth/login', { email, password })
  setToken(data.access_token)
  return data.user
}

export async function register(payload) {
  const data = await api.post('/api/auth/register', payload)
  setToken(data.access_token)
  return data.user
}

export const me = () => api.get('/api/auth/me')

// Which social buttons this deployment can actually serve.
export const oauthProviders = () => api.get('/api/auth/oauth/providers')

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Full-page redirect: the provider will not run inside fetch/XHR.
export function startOAuth(provider, role = 'student') {
  window.location.href = `${API_BASE}/api/auth/oauth/${provider}/login?role=${role}`
}

// Called by /auth/callback once the backend hands back a signed token.
export async function completeOAuth(token) {
  setToken(token)
  return api.get('/api/auth/me')
}

export const logout = () => clearToken()
