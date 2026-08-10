import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Select, Spinner, TagList } from '../../components/ui'
import {
  listApplications,
  rankApplicants,
  updateApplicationStatus,
} from '../../services/recruiterService'

const STATUSES = ['applied', 'shortlisted', 'rejected', 'hired']

function scoreTone(score) {
  if (score == null) return 'neutral'
  return score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red'
}

export default function Applicants() {
  const { internshipId } = useParams()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listApplications(internshipId)
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [internshipId])

  async function runRanking() {
    setRanking(true)
    setError('')
    try {
      setApplications(await rankApplicants(internshipId))
    } catch (err) {
      setError(err.message)
    } finally {
      setRanking(false)
    }
  }

  async function changeStatus(applicationId, status) {
    setError('')
    try {
      const updated = await updateApplicationStatus(applicationId, status)
      setApplications((current) =>
        current.map((a) => (a.id === applicationId ? { ...a, status: updated.status } : a)),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Spinner label="Loading applicants..." />

  const ranked = applications.filter((a) => a.match).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/recruiter" className="text-sm text-primary hover:underline">
            ← Back to postings
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-on-surface">
            Applicants{applications[0] ? ` — ${applications[0].internship_title}` : ''}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {applications.length} applicant{applications.length === 1 ? '' : 's'} · {ranked} scored
            by AI
          </p>
        </div>
        <Button onClick={runRanking} disabled={ranking || applications.length === 0}>
          {ranking ? 'Ranking with Llama 3...' : 'Rank candidates with AI'}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {ranking && (
        <Card>
          <Spinner label="Scoring each applicant against the job description — this takes a moment..." />
        </Card>
      )}

      {applications.length === 0 && !error && (
        <Card>
          <p className="text-sm text-on-surface-variant">No one has applied to this role yet.</p>
        </Card>
      )}

      {applications.map((application, index) => (
        <Card key={application.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {application.match && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-container-high text-sm font-semibold text-on-surface-variant">
                  {index + 1}
                </span>
              )}
              <div>
                <h3 className="font-semibold text-on-surface">{application.student_name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone={scoreTone(application.match?.match_score)}>
                    {application.match ? `Match ${application.match.match_score}/100` : 'Not scored'}
                  </Badge>
                  <Badge tone={application.status === 'hired' ? 'green' : 'neutral'}>
                    {application.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Select
              value={application.status}
              onChange={(e) => changeStatus(application.id, e.target.value)}
              className="w-40"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          {application.match && (
            <div className="mt-3 grid gap-3 rounded-lg bg-surface-container-low p-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  Matching skills
                </p>
                <TagList items={application.match.matching_skills} tone="green" empty="None found" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  Missing skills
                </p>
                <TagList items={application.match.missing_skills} tone="amber" empty="None" />
              </div>
              {application.match.rationale && (
                <p className="text-sm text-on-surface-variant sm:col-span-2">{application.match.rationale}</p>
              )}
            </div>
          )}

          {application.match_error && (
            <p className="mt-2 text-xs text-red-600">Scoring failed: {application.match_error}</p>
          )}
        </Card>
      ))}
    </div>
  )
}
