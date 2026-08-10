import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHealth } from '../services/api'
import { Icon } from '../components/ui'

const NAV_BY_ROLE = {
  student: [
    { to: '/student', label: 'Home', icon: 'dashboard', end: true },
    { to: '/student/roadmap', label: 'Skill Tree Roadmap', icon: 'account_tree' },
    { to: '/student/courses', label: 'Skill Courses', icon: 'auto_stories' },
    { to: '/student/daily-tests', label: 'Daily Mock Quiz', icon: 'quiz' },
    { to: '/student/tracker', label: 'Program Tracker', icon: 'analytics' },
    { to: '/student/internships', label: 'Search', icon: 'search' },
    { to: '/student/applications', label: 'Applications', icon: 'fact_check' },
    { to: '/student/profile', label: 'Profile & Resume', icon: 'person' },
  ],
  recruiter: [
    { to: '/recruiter', label: 'Postings', icon: 'work', end: true },
    { to: '/recruiter/new', label: 'Post New', icon: 'add_circle' },
  ],
  admin: [{ to: '/admin', label: 'Analytics', icon: 'monitoring', end: true }],
}

const ROLE_LABEL = {
  student: 'Student Portal',
  recruiter: 'Recruiter Portal',
  admin: 'Placement Officer',
}

function HealthBanner() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null))
  }, [])

  if (!health || health.status === 'ok') return null

  const problems = []
  if (!health.database.connected) problems.push('MongoDB is not reachable')
  if (!health.ollama.reachable) problems.push('Ollama is not running (`ollama serve`)')
  else if (!health.ollama.model_ready)
    problems.push(`Model "${health.ollama.model}" is not pulled yet (\`ollama pull ${health.ollama.model}\`)`)

  if (!problems.length) return null

  return (
    <div className="bg-secondary-container/30 px-6 py-2 text-center text-sm text-on-secondary-container">
      AI features are limited — {problems.join(' · ')}
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAV_BY_ROLE[user?.role] ?? []

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 md:flex">
      {/* Left sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-outline-variant/60 bg-surface-container-lowest md:flex">
        <Link to="/" className="flex items-center gap-2 px-6 py-6">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-on-primary">
            <Icon name="hub" className="!text-lg" />
          </span>
          <div>
            <p className="font-bold leading-tight text-on-surface">CareerPulse AI</p>
            <p className="text-xs text-on-surface-variant">{ROLE_LABEL[user?.role]}</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <Icon name={link.icon} className="!text-xl" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-outline-variant/60 p-4">
          <p className="truncate text-sm font-semibold text-on-surface">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
          >
            <Icon name="logout" className="!text-xl" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Top bar — mobile only */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-lowest/90 px-6 py-3 backdrop-blur md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <Icon name="hub" className="text-primary" />
            <span className="font-bold text-on-surface">CareerPulse AI</span>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-outline-variant px-3 py-1.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
          >
            Sign out
          </button>
        </header>

        <HealthBanner />

        <main className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-outline-variant/60 bg-surface-container-lowest/95 backdrop-blur md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            <Icon name={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
