import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Icon, Input, ScoreRing, Spinner, TagList } from '../../components/ui'
import {
  applyToInternship,
  listApplications,
  listInternships,
  previewMatch,
} from '../../services/studentService'

function scoreVerdict(score) {
  if (score >= 75) return 'Strong Candidate'
  if (score >= 40) return 'Building Fit'
  return 'Significant Gaps'
}

function MatchResult({ match }) {
  return (
    <div className="mt-4 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 p-4">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
        <ScoreRing score={match.match_score} size={110} label="Readiness for Role" hint={scoreVerdict(match.match_score)} />
        <div className="flex-1 space-y-3">
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <Icon name="check_circle" className="!text-base" /> Skills you have
            </p>
            <TagList items={match.matching_skills} tone="green" empty="No overlap found" />
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <Icon name="error" className="!text-base" /> Skills you're missing
            </p>
            <TagList items={match.missing_skills} tone="amber" empty="Nothing major" />
          </div>
          {match.rationale && <p className="text-sm text-on-surface-variant">{match.rationale}</p>}
        </div>
      </div>
    </div>
  )
}

function InternshipCard({ internship, applied, onApply }) {
  const [match, setMatch] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function checkMatch() {
    setBusy('match')
    setError('')
    try {
      setMatch(await previewMatch(internship.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function apply() {
    setBusy('apply')
    setError('')
    try {
      await onApply(internship.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-on-surface">{internship.title}</h3>
          <p className="text-sm font-medium text-primary">{internship.company}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1"><Icon name="location_on" className="!text-base" />{internship.location}</span>
            <span className="flex items-center gap-1"><Icon name="schedule" className="!text-base" />{internship.duration}</span>
            {internship.stipend && (
              <span className="flex items-center gap-1 font-semibold text-on-secondary-container">
                <Icon name="payments" className="!text-base" />{internship.stipend}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={checkMatch} disabled={busy !== ''}>
            <Icon name="analytics" className="!text-base" />
            {busy === 'match' ? 'Scoring...' : 'Check my match'}
          </Button>
          <Button onClick={apply} disabled={applied || busy !== ''}>
            {applied ? 'Applied' : busy === 'apply' ? 'Applying...' : 'Quick Apply'}
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{internship.description}</p>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-outline">
          Required skills
        </p>
        <TagList items={internship.required_skills} />
      </div>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
      {busy === 'match' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          Llama 3 is comparing your profile to this role...
        </div>
      )}
      {match && busy !== 'match' && <MatchResult match={match} />}
    </Card>
  )
}

export default function Internships() {
  const [internships, setInternships] = useState([])
  const [appliedIds, setAppliedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [activeSkill, setActiveSkill] = useState('')

  useEffect(() => {
    Promise.all([listInternships(), listApplications()])
      .then(([jobs, applications]) => {
        setInternships(jobs)
        setAppliedIds(new Set(applications.map((a) => a.internship_id)))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleApply(internshipId) {
    await applyToInternship(internshipId)
    setAppliedIds((current) => new Set(current).add(internshipId))
  }

  const locations = useMemo(
    () => [...new Set(internships.map((i) => i.location))].sort(),
    [internships],
  )
  const skills = useMemo(
    () => [...new Set(internships.flatMap((i) => i.required_skills || []))].sort(),
    [internships],
  )

  const filtered = internships.filter((internship) => {
    const text = `${internship.title} ${internship.company}`.toLowerCase()
    if (search && !text.includes(search.toLowerCase())) return false
    if (location && internship.location !== location) return false
    if (remoteOnly && !internship.location?.toLowerCase().includes('remote')) return false
    if (activeSkill && !internship.required_skills?.includes(activeSkill)) return false
    return true
  })

  if (loading) return <Spinner label="Loading internships..." />

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-72">
        <Card>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Filters
          </h2>
          <Input
            label="Search"
            placeholder="Title or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-on-surface">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            Remote only
          </label>

          {skills.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-on-surface">Target Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <button key={skill} onClick={() => setActiveSkill(activeSkill === skill ? '' : skill)}>
                    <Badge tone={activeSkill === skill ? 'primary' : 'neutral'}>{skill}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(search || location || remoteOnly || activeSkill) && (
            <button
              onClick={() => {
                setSearch('')
                setLocation('')
                setRemoteOnly(false)
                setActiveSkill('')
              }}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>
      </aside>

      <div className="flex-1 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Explore Internships</h1>
          <p className="text-sm text-on-surface-variant">
            {filtered.length} of {internships.length} open{' '}
            {internships.length === 1 ? 'role' : 'roles'} match your filters — check your AI match
            score before applying.
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        {filtered.length === 0 && !error && (
          <Card>
            <p className="text-sm text-on-surface-variant">
              {internships.length === 0
                ? 'No open internships right now. Check back soon.'
                : 'No internships match your filters.'}
            </p>
          </Card>
        )}

        {filtered.map((internship) => (
          <InternshipCard
            key={internship.id}
            internship={internship}
            applied={appliedIds.has(internship.id)}
            onApply={handleApply}
          />
        ))}
      </div>
    </div>
  )
}
