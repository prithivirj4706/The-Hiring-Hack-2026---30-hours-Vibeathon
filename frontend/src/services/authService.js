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

export const logout = () => clearToken()
