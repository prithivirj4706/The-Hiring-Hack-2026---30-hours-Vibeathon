import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AiChip,
  Alert,
  Badge,
  Button,
  Card,
  Icon,
  ProgressBar,
  ScoreRing,
  SectionTitle,
  Spinner,
  TagList,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import {
  generateRecommendations,
  getProfile,
  getRecommendations,
  listApplications,
  listInternships,
} from '../../services/studentService'

function profileChecklist(profile) {
  return [
    { label: 'Academic details', done: Boolean(profile?.branch && profile?.year) },
    { label: 'Skills added', done: (profile?.skills?.length ?? 0) > 0 },
    { label: 'Resume analysed', done: Boolean(profile?.last_analyzed_at) },
  ]
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [applications, setApplications] = useState([])
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getProfile(), getRecommendations(), listApplications(), listInternships()])
      .then(([p, r, a, i]) => {
        setProfile(p)
        setRecommendation(r)
        setApplications(a)
        setInternships(i)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function runRecommendations() {
    setGenerating(true)
    setError('')
    try {
      setRecommendation(await generateRecommendations())
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <Spinner label="Loading your dashboard..." />

  const checklist = profileChecklist(profile)
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
  const shortlisted = applications.filter((a) => a.status === 'shortlisted').length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Hello, {user.name.split(' ')[0]}!</h1>
        <p className="text-sm text-on-surface-variant">
          Welcome back to your career command center. {profile?.branch} · Year {profile?.year}
          {profile?.cgpa ? ` · CGPA ${profile.cgpa}` : ''} — your AI agent has matched{' '}
          {internships.length} open internship{internships.length === 1 ? '' : 's'} against your profile.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap gap-3">
        <Link to="/student/profile">
          <Button variant="secondary">
            <Icon name="upload_file" className="!text-base" /> Upload Resume
          </Button>
        </Link>
        <Link to="/student/internships">
          <Button>
            <Icon name="search" className="!text-base" /> Find Internships
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-1">
          <ScoreRing
            score={profile?.readiness_score}
            hint={
              profile?.readiness_score >= 75
                ? "You're in a strong position with recruiters this month."
                : undefined
            }
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-on-surface">Profile Status</span>
            <Badge tone={completion === 100 ? 'green' : 'amber'}>{completion}% Complete</Badge>
          </div>
          <ProgressBar value={completion} />
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <Icon
                  name={item.done ? 'check_circle' : 'radio_button_unchecked'}
                  className={item.done ? 'text-emerald-600' : 'text-outline'}
                />
                <span className={item.done ? 'text-on-surface' : 'text-on-surface-variant'}>{item.label}</span>
              </li>
            ))}
          </ul>
          {completion < 100 && (
            <Link to="/student/profile" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Complete Profile <Icon name="arrow_forward" className="!text-base" />
            </Link>
          )}
        </Card>

        <Card className="bg-primary text-on-primary">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Resume Status</span>
            <Badge tone={profile?.last_analyzed_at ? 'green' : 'neutral'}>
              {profile?.last_analyzed_at ? 'PARSED' : 'NOT ANALYSED'}
            </Badge>
          </div>
          {profile?.last_analyzed_at ? (
            <>
              <p className="text-sm text-on-primary/85">
                {profile.skills?.length ?? 0} skills extracted. Scored live by Llama 3.
              </p>
              <Link to="/student/profile">
                <Button variant="secondary" className="mt-3 w-full !bg-white !text-primary">
                  Re-analyse Resume
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-on-primary/85">Upload your resume for an instant AI scan.</p>
              <Link to="/student/profile">
                <Button variant="secondary" className="mt-3 w-full !bg-white !text-primary">
                  Upload Resume
                </Button>
              </Link>
            </>
          )}
          <p className="mt-3 text-xs text-on-primary/70">
            Applications: {applications.length} · Shortlisted: {shortlisted}
          </p>
        </Card>
      </div>

      {profile?.skills?.length > 0 && (
        <Card>
          <SectionTitle title="Top Skills" subtitle="Extracted from your profile and resume" />
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li key={skill}>
                <Badge tone="primary">{skill}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {profile?.resume_summary && (
        <Card>
          <SectionTitle title="AI resume summary" />
          <p className="text-sm leading-relaxed text-on-surface-variant">{profile.resume_summary}</p>
        </Card>
      )}

      <Card>
        <SectionTitle
          title="Recommended Roles"
          subtitle="Generated live from your profile by Llama 3"
          action={
            <Button onClick={runRecommendations} disabled={generating} variant="secondary">
              {generating ? 'Thinking...' : recommendation ? 'Regenerate' : 'Generate'}
            </Button>
          }
        />

        {generating && <Spinner label="Llama 3 is analysing your profile..." />}

        {!generating && !recommendation && (
          <p className="text-sm text-on-surface-variant">
            No recommendations yet. Generate them to see career paths, skill gaps and a learning
            roadmap.
          </p>
        )}

        {!generating && recommendation && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendation.recommended_paths?.map((path) => (
                <div key={path} className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
                  <AiChip>AI Recommended</AiChip>
                  <h3 className="mt-2 font-semibold text-on-surface">{path}</h3>
                </div>
              ))}
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-on-surface">Skill gaps to close</h3>
              <TagList items={recommendation.skill_gaps} tone="amber" />
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-on-surface">Learning roadmap</h3>
              {recommendation.learning_roadmap?.length ? (
                <ol className="list-inside list-decimal space-y-1 text-sm text-on-surface-variant">
                  {recommendation.learning_roadmap.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-outline">None yet</p>
              )}
            </div>
            {recommendation.rationale && (
              <div className="rounded-lg bg-surface-container-low p-3">
                <h3 className="mb-1 text-sm font-semibold text-on-surface">Why</h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">{recommendation.rationale}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Targeted Opportunities"
          action={
            <Link to="/student/internships" className="text-sm font-semibold text-primary hover:underline">
              Explore all
            </Link>
          }
        />
        {internships.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No open internships right now.</p>
        ) : (
          <ul className="divide-y divide-outline-variant/60">
            {internships.slice(0, 4).map((internship) => (
              <li key={internship.id}>
                <Link
                  to="/student/internships"
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-surface-container-low/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-fixed/50 font-bold text-primary-dark">
                      {internship.company?.[0] ?? 'C'}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{internship.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {internship.company} · {internship.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {internship.stipend && (
                      <span className="hidden text-xs font-semibold text-on-secondary-container sm:block">
                        {internship.stipend}
                      </span>
                    )}
                    <Icon name="chevron_right" className="text-outline" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
