import { useEffect, useState } from 'react'
import { Alert, Badge, Card, Spinner } from '../../components/ui'
import { listApplications } from '../../services/studentService'

const STATUS_TONES = {
  applied: 'neutral',
  shortlisted: 'indigo',
  hired: 'green',
  rejected: 'red',
}

export default function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listApplications()
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading your applications..." />

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">My Applications</h1>
        <p className="text-sm text-on-surface-variant">Track where you stand with each employer.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      {applications.length === 0 && !error ? (
        <Card>
          <p className="text-sm text-on-surface-variant">No applications yet.</p>
        </Card>
      ) : (
        applications.map((application) => (
          <Card key={application.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-on-surface">{application.internship_title}</h3>
                <p className="text-sm text-on-surface-variant">{application.company}</p>
              </div>
              <Badge tone={STATUS_TONES[application.status] ?? 'neutral'}>{application.status}</Badge>
            </div>

            {application.match && (
              <div className="mt-3 rounded-lg bg-surface-container-low p-3 text-sm">
                <p className="font-medium text-on-surface">
                  Recruiter-side AI match: {application.match.match_score}/100
                </p>
                {application.match.rationale && (
                  <p className="mt-1 text-on-surface-variant">{application.match.rationale}</p>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
