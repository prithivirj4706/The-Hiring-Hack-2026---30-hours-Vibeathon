const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed')
  }
  return data
}

export const analyzeResume = (resumeText) => post('/api/ai/resume-analysis', { resume_text: resumeText })

export const getRecommendations = (studentProfile) =>
  post('/api/ai/recommendations', { student_profile: studentProfile })

export const matchResumeToJob = (resumeText, jobDescription) =>
  post('/api/ai/match', { resume_text: resumeText, job_description: jobDescription })
