import { useEffect, useState } from 'react'
import {
  AiChip,
  Alert,
  Button,
  Card,
  Icon,
  Input,
  ScoreRing,
  SectionTitle,
  Spinner,
  TagList,
  Textarea,
} from '../../components/ui'
import { getProfile, updateProfile, uploadResume } from '../../services/studentService'
import { uploadResumePdf } from '../../services/resumePdfService'

const toList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState({ saving: false, analyzing: false, message: '', error: '' })

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setResumeText(data.resume_text || '')
        setForm({
          name: data.name || '',
          branch: data.branch || '',
          year: data.year || 1,
          cgpa: data.cgpa ?? '',
          skills: (data.skills || []).join(', '),
          projects: (data.projects || []).join(', '),
          certifications: (data.certifications || []).join(', '),
          interests: (data.interests || []).join(', '),
        })
      })
      .catch((err) => setStatus((s) => ({ ...s, error: err.message })))
  }, [])

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function save(event) {
    event.preventDefault()
    setStatus({ saving: true, analyzing: false, message: '', error: '' })
    try {
      const updated = await updateProfile({
        name: form.name,
        branch: form.branch,
        year: Number(form.year),
        cgpa: form.cgpa === '' ? null : Number(form.cgpa),
        skills: toList(form.skills),
        projects: toList(form.projects),
        certifications: toList(form.certifications),
        interests: toList(form.interests),
      })
      setProfile(updated)
      setStatus({ saving: false, analyzing: false, message: 'Profile saved.', error: '' })
    } catch (err) {
      setStatus({ saving: false, analyzing: false, message: '', error: err.message })
    }
  }

  async function analyze() {
    setStatus({ saving: false, analyzing: true, message: '', error: '' })
    try {
      const result = await uploadResume(resumeText)
      setAnalysis(result.analysis)
      setProfile(result.profile)
      setForm((current) => ({
        ...current,
        skills: (result.profile.skills || []).join(', '),
        projects: (result.profile.projects || []).join(', '),
        certifications: (result.profile.certifications || []).join(', '),
      }))
      setStatus({
        saving: false,
        analyzing: false,
        message: 'Resume analysed and profile updated.',
        error: '',
      })
    } catch (err) {
      setStatus({ saving: false, analyzing: false, message: '', error: err.message })
    }
  }

  // Additive PDF upload path — parallel to analyze() above, reuses the same result shape.
  async function analyzePdfFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus({ saving: false, analyzing: true, message: '', error: '' })
    try {
      const result = await uploadResumePdf(file)
      setAnalysis(result.analysis)
      setProfile(result.profile)
      setResumeText(result.profile.resume_text || '')
      setForm((current) => ({
        ...current,
        skills: (result.profile.skills || []).join(', '),
        projects: (result.profile.projects || []).join(', '),
        certifications: (result.profile.certifications || []).join(', '),
      }))
      setStatus({
        saving: false,
        analyzing: false,
        message: 'PDF resume analysed and profile updated.',
        error: '',
      })
    } catch (err) {
      setStatus({ saving: false, analyzing: false, message: '', error: err.message })
    }
  }

  if (!form) return <Spinner label="Loading your profile..." />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">My Profile</h1>
        <p className="text-sm text-on-surface-variant">AI-powered insights for your technical portfolio.</p>
      </div>

      {status.error && <Alert>{status.error}</Alert>}
      {status.message && <Alert tone="success">{status.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <SectionTitle title="Academic details" subtitle="Used by the recommendation engine" />
          <form onSubmit={save} className="flex flex-col gap-3">
            <Input label="Full name" value={form.name} onChange={set('name')} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Branch" value={form.branch} onChange={set('branch')} placeholder="CSE" />
              <Input label="Year" type="number" min="1" max="5" value={form.year} onChange={set('year')} />
              <Input
                label="CGPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.cgpa}
                onChange={set('cgpa')}
              />
            </div>
            <Input
              label="Skills (comma separated)"
              value={form.skills}
              onChange={set('skills')}
              placeholder="Python, React, SQL"
            />
            <Input label="Projects (comma separated)" value={form.projects} onChange={set('projects')} />
            <Input
              label="Certifications (comma separated)"
              value={form.certifications}
              onChange={set('certifications')}
            />
            <Input
              label="Interests (comma separated)"
              value={form.interests}
              onChange={set('interests')}
              placeholder="Backend Engineering, Cloud"
            />
            <Button type="submit" disabled={status.saving} className="self-start">
              {status.saving ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-2">
          <ScoreRing
            score={profile?.readiness_score}
            hint={
              profile?.last_analyzed_at
                ? 'Scored by Llama 3 from your resume'
                : 'Analyse your resume to get a score'
            }
          />
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Resume Analysis"
          subtitle="Paste your resume text — Llama 3 extracts skills, projects and a readiness score"
          action={
            <Button onClick={analyze} disabled={status.analyzing || resumeText.trim().length < 20}>
              {status.analyzing ? 'Analysing...' : 'Analyse resume'}
            </Button>
          }
        />
        <Textarea
          rows={10}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your full resume text here (minimum 20 characters)..."
          className="font-mono text-xs"
        />

        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-outline">Or</span>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low">
            <Icon name="picture_as_pdf" className="!text-base" />
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={analyzePdfFile}
              disabled={status.analyzing}
              className="hidden"
            />
          </label>
        </div>

        {status.analyzing && (
          <div className="mt-3">
            <Spinner label="Llama 3 is reading your resume..." />
          </div>
        )}

        {analysis && !status.analyzing && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg bg-primary-fixed/25 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="check_circle" className="text-emerald-600" />
                <h3 className="font-semibold text-on-surface">AI Summary</h3>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{analysis.summary}</p>
              {analysis.experience_years > 0 && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {analysis.experience_years} yr{analysis.experience_years === 1 ? '' : 's'} of experience detected
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface">Extracted Skills</h3>
                  <AiChip>AI Detected</AiChip>
                </div>
                <TagList items={analysis.skills} tone="primary" />
              </div>
              <div>
                <h3 className="mb-1.5 text-sm font-semibold text-on-surface">Certifications</h3>
                <TagList items={analysis.certifications} />
              </div>
              <div className="sm:col-span-2">
                <h3 className="mb-1.5 text-sm font-semibold text-on-surface">Projects</h3>
                <TagList items={analysis.projects} />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
