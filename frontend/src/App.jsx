import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import AppLayout from './layouts/AppLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AiDemo from './pages/AiDemo'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Applicants from './pages/recruiter/Applicants'
import RecruiterDashboard from './pages/recruiter/Dashboard'
import PostInternship from './pages/recruiter/PostInternship'
import Register from './pages/Register'
import Applications from './pages/student/Applications'
import Courses from './pages/student/Courses'
import DailyMockTest from './pages/student/DailyMockTest'
import StudentDashboard from './pages/student/Dashboard'
import Internships from './pages/student/Internships'
import StudentProfile from './pages/student/Profile'
import ProgramTracker from './pages/student/ProgramTracker'
import SkillTreeRoadmap from './pages/student/SkillTreeRoadmap'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="roadmap" element={<SkillTreeRoadmap />} />
            <Route path="courses" element={<Courses />} />
            <Route path="daily-tests" element={<DailyMockTest />} />
            <Route path="tracker" element={<ProgramTracker />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="internships" element={<Internships />} />
            <Route path="applications" element={<Applications />} />
          </Route>

          <Route
            path="/recruiter"
            element={
              <ProtectedRoute roles={['recruiter']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RecruiterDashboard />} />
            <Route path="new" element={<PostInternship />} />
            <Route path="internships/:internshipId/applicants" element={<Applicants />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* Raw AI service playground — handy for demoing the LLM layer directly. */}
          <Route
            path="/ai-demo"
            element={
              <ProtectedRoute>
                <AiDemo />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
