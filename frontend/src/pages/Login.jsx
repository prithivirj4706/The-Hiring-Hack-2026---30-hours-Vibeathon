import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Icon, Input } from '../components/ui'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'
import { oauthProviders, startOAuth } from '../services/authService'

const QUICK_LOGINS = [
  { label: 'Student', email: 'ananya@bput.ac.in', icon: 'school' },
  { label: 'Recruiter', email: 'kavita@technova.com', icon: 'business_center' },
  { label: 'Placement Officer', email: 'admin@bput.ac.in', icon: 'verified' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [social, setSocial] = useState({ google: false, github: false })
  const [socialRole, setSocialRole] = useState('student')

  // Only offer the buttons this deployment has credentials for.
  useEffect(() => {
    oauthProviders()
      .then(setSocial)
      .catch(() => setSocial({ google: false, github: false }))
  }, [])

  if (user) return <Navigate to={HOME_BY_ROLE[user.role] ?? '/'} replace />

  async function submit(event, credentials) {
    event?.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedIn = await login(credentials?.email ?? email, credentials?.password ?? password)
      navigate(HOME_BY_ROLE[loggedIn.role] ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8">
      <div className="grid w-full max-w-[1100px] overflow-hidden rounded-xl bg-surface-container-lowest shadow-md md:grid-cols-2">
        {/* Left branding panel — desktop only */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-on-primary md:flex">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary to-tertiary/60" />
          <div>
            <div className="mb-8 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
                <Icon name="hub" className="!text-lg" />
              </span>
              <span className="text-lg font-bold">CareerPulse AI</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight">
              Accelerate your <span className="text-secondary-container">career journey</span> with
              precision AI.
            </h1>
            <p className="mt-4 max-w-sm text-on-primary/80">
              The AI-driven portal for resume optimization, skill gap analysis, and internship
              discovery.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3">
              <Icon name="shield" className="text-secondary-container" />
              <span className="text-sm font-medium">Secure, role-based access</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3">
              <Icon name="auto_awesome" className="text-secondary-container" />
              <span className="text-sm font-medium">Powered by real Llama 3 models</span>
            </div>
          </div>
        </div>

        {/* Auth form */}
        <div className="p-8 md:p-12">
          <Link to="/" className="mb-6 flex items-center gap-2 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">
              <Icon name="hub" className="!text-lg" />
            </span>
            <span className="font-bold text-on-surface">CareerPulse AI</span>
          </Link>

          <h2 className="text-2xl font-bold text-on-surface">Welcome back</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Please enter your details to sign in.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              action={
                <a href="#" className="text-sm font-semibold text-primary hover:underline" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              }
            />
            {error && <Alert>{error}</Alert>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="mx-4 shrink-0 text-xs font-semibold uppercase tracking-wider text-outline">Or</span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          {(social.google || social.github) && (
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <span>Sign up as</span>
                {['student', 'recruiter'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSocialRole(role)}
                    className={`rounded-full px-3 py-1 font-semibold capitalize transition-colors ${
                      socialRole === role
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <p className="mb-3 text-center text-xs text-outline">
                Only applies the first time — returning accounts keep their role.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {social.google && (
              <button
                type="button"
                onClick={() => startOAuth('google', socialRole)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <Icon name="account_circle" />
                Continue with Google
              </button>
            )}

            {social.github && (
              <button
                type="button"
                onClick={() => startOAuth('github', socialRole)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#24292f] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Icon name="code" />
                Continue with GitHub
              </button>
            )}

            {!social.google && !social.github && (
              <p className="rounded-lg border border-dashed border-outline-variant px-4 py-3 text-center text-xs text-on-surface-variant">
                Social sign-in is not configured on this server.
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-outline-variant/60 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">Demo accounts</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOGINS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={loading}
                  onClick={(event) => submit(event, { email: account.email, password: 'demo1234' })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
                >
                  <Icon name={account.icon} className="!text-base" />
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
