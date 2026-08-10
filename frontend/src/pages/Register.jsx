import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Icon, Input, Select } from '../components/ui'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other']

const ROLES = [
  { value: 'student', label: 'Student', icon: 'school' },
  { value: 'recruiter', label: 'Recruiter', icon: 'business_center' },
  { value: 'admin', label: 'Placement Officer', icon: 'verified' },
]

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    branch: 'CSE',
    year: 3,
    company: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={HOME_BY_ROLE[user.role] ?? '/'} replace />

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    }
    if (form.role === 'student') {
      payload.branch = form.branch
      payload.year = Number(form.year)
    }
    if (form.role === 'recruiter') payload.company = form.company

    try {
      const registered = await register(payload)
      navigate(HOME_BY_ROLE[registered.role] ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-4 flex items-center justify-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">
            <Icon name="hub" className="!text-lg" />
          </span>
          <span className="font-bold text-on-surface">CareerPulse AI</span>
        </Link>

        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-on-surface">Join CareerPulse AI</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Tell us who you are.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <div>
              <span className="mb-2 block text-sm font-semibold text-on-surface">Select Your Role</span>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`group flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                      form.role === role.value
                        ? 'border-primary bg-primary-fixed/30'
                        : 'border-outline-variant bg-surface-container-low hover:border-primary/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={form.role === role.value}
                      onChange={set('role')}
                      className="hidden"
                    />
                    <Icon
                      name={role.icon}
                      className={`mr-3 ${form.role === role.value ? 'text-primary' : 'text-outline'}`}
                    />
                    <span className="font-medium text-on-surface">{role.label}</span>
                    {form.role === role.value && (
                      <Icon name="check_circle" className="ml-auto text-primary" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <Input label="Full name" value={form.name} onChange={set('name')} required />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder={form.role === 'student' ? 'you@university.edu' : 'you@yourcompany.com'}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              minLength={6}
              placeholder="At least 6 characters"
              required
            />

            {form.role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Branch" value={form.branch} onChange={set('branch')}>
                  {BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </Select>
                <Select label="Year" value={form.year} onChange={set('year')}>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {form.role === 'recruiter' && (
              <Input label="Company" value={form.company} onChange={set('company')} required />
            )}

            {error && <Alert>{error}</Alert>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
