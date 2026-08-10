import { api } from './api'

export const getProfile = () => api.get('/api/recruiter/me')
export const listInternships = () => api.get('/api/recruiter/internships')
export const createInternship = (payload) => api.post('/api/recruiter/internships', payload)
export const updateInternship = (id, payload) => api.put(`/api/recruiter/internships/${id}`, payload)
export const deleteInternship = (id) => api.del(`/api/recruiter/internships/${id}`)
export const listApplications = (id) => api.get(`/api/recruiter/internships/${id}/applications`)
export const updateApplicationStatus = (applicationId, status) =>
  api.put(`/api/recruiter/applications/${applicationId}/status`, { status })
export const rankApplicants = (internshipId) =>
  api.post(`/api/matching/internships/${internshipId}/rank`)
