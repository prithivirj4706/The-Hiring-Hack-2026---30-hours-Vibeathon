import { api } from './api'

export const getProfile = () => api.get('/api/student/me')
export const updateProfile = (payload) => api.put('/api/student/me', payload)
export const uploadResume = (resumeText) => api.post('/api/student/me/resume', { resume_text: resumeText })
export const generateRecommendations = () => api.post('/api/student/me/recommendations')
export const getRecommendations = () => api.get('/api/student/me/recommendations')
export const listInternships = () => api.get('/api/student/internships')
export const applyToInternship = (internshipId) =>
  api.post('/api/student/applications', { internship_id: internshipId })
export const listApplications = () => api.get('/api/student/applications')
export const previewMatch = (internshipId) => api.post(`/api/matching/internships/${internshipId}/preview`)
