// Additive PDF resume upload — separate from the existing text-paste flow in studentService.js.
// Uses its own fetch call (not the shared `api` helper) because file uploads need
// multipart/form-data, not the JSON body the shared helper always sends.
import { getToken } from './api'

// Use 127.0.0.1 (not "localhost") to force IPv4 — see note in api.js.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function uploadResumePdf(file) {
  const formData = new FormData()
  formData.append('file', file)

  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  let res
  try {
    res = await fetch(`${API_BASE}/api/student/me/resume-pdf`, {
      method: 'POST',
      headers,
      body: formData,
    })
  } catch {
    throw new Error('Cannot reach the API server. Is the backend running on port 8000?')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(', ')
      : detail || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}
