import { api } from './api'

export const getOverview = () => api.get('/api/analytics/overview')
export const getBranches = () => api.get('/api/analytics/branches')
export const getSkills = () => api.get('/api/analytics/skills')
