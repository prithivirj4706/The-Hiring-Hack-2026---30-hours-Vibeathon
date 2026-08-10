import { api } from './api'

export const getCourses = () => api.get('/api/learning/courses')
export const getEnrollments = () => api.get('/api/learning/enrollments')
export const enrollCourse = (courseId) => api.post(`/api/learning/courses/${courseId}/enroll`)
export const updateCourseProgress = (courseId, lessonId) =>
  api.put(`/api/learning/courses/${courseId}/progress`, { lesson_id: lessonId })

export const getDailyMockTests = () => api.get('/api/learning/mock-tests/daily')
export const submitMockTest = (testId, answers) =>
  api.post(`/api/learning/mock-tests/${testId}/submit`, { answers })

export const getSkillTree = () => api.get('/api/learning/skill-tree')
export const getProgramTracker = () => api.get('/api/learning/program-tracker')
