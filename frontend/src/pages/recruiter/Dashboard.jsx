import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Button, Card, Spinner, Stat, TagList } from '../../components/ui'
import { deleteInternship, listInternships, updateInternship } from '../../services/recruiterService'

export default function RecruiterDashboard() {
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    listInternships()
      .then(setInternships)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  async function toggleStatus(internship) {
    setBusyId(internship.id)
    setError('')
    try {
      const next = internship.status === 'open' ? 'closed' : 'open'
      const updated = await updateInternship(internship.id, { status: next })
      setInternships((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...updated, application_count: item.application_count } : item,
        ),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  async function remove(internship) {
    if (!window.confirm(`Delete "${internship.title}" and all its applications?`)) return
    setBusyId(internship.id)
    setError('')
    try {
      await deleteInternship(internship.id)
      setInternships((current) => current.filter((item) => item.id !== internship.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  if (loading) return <Spinner label="Loading your postings..." />

  const totalApplications = internships.reduce((sum, i) => sum + (i.application_count ?? 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">My Postings</h1>
          <p className="text-sm text-on-surface-variant">Manage internships and review AI-ranked applicants.</p>
        </div>
        <Link
          to="/recruiter/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:scale-[1.02]"
        >
          Post internship
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Postings" value={internships.length} />
        <Stat label="Open roles" value={internships.filter((i) => i.status === 'open').length} />
        <Stat label="Total applicants" value={totalApplications} />
      </div>

      {internships.length === 0 && !error && (
        <Card>
          <p className="text-sm text-on-surface-variant">
            No postings yet.{' '}
            <Link to="/recruiter/new" className="font-medium text-primary hover:underline">
              Create your first internship
            </Link>
          </p>
        </Card>
      )}

      {internships.map((internship) => (
        <Card key={internship.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-on-surface">{internship.title}</h3>
                <Badge tone={internship.status === 'open' ? 'green' : 'neutral'}>
                  {internship.status}
                </Badge>
              </div>
              <p className="text-sm text-on-surface-variant">
                {internship.location} · {internship.duration}
                {internship.stipend ? ` · ${internship.stipend}` : ''} ·{' '}
                {internship.application_count ?? 0} applicant
                {internship.application_count === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/recruiter/internships/${internship.id}/applicants`}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:scale-[1.02]"
              >
                View applicants
              </Link>
              <Button
                variant="secondary"
                onClick={() => toggleStatus(internship)}
                disabled={busyId === internship.id}
              >
                {internship.status === 'open' ? 'Close' : 'Reopen'}
              </Button>
              <Button
                variant="danger"
                onClick={() => remove(internship)}
                disabled={busyId === internship.id}
              >
                Delete
              </Button>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-sm text-on-surface">{internship.description}</p>
          <div className="mt-3">
            <TagList items={internship.required_skills} />
          </div>
        </Card>
      ))}
    </div>
  )
}
