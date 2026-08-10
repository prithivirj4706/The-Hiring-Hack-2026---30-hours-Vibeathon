import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input, SectionTitle, Textarea } from '../../components/ui'
import { createInternship } from '../../services/recruiterService'

export default function PostInternship() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: 'Remote',
    stipend: '',
    duration: '3 months',
    required_skills: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createInternship({
        ...form,
        required_skills: form.required_skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      })
      navigate('/recruiter')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-semibold text-on-surface">Post an Internship</h1>

      <Card>
        <SectionTitle
          title="Role details"
          subtitle="The description is what the AI matches student profiles against — be specific."
        />
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input
            label="Title"
            value={form.title}
            onChange={set('title')}
            placeholder="Backend Developer Intern"
            required
          />
          <Textarea
            label="Description"
            rows={7}
            value={form.description}
            onChange={set('description')}
            placeholder="What the intern will work on, the stack, and what you expect them to know..."
            required
            minLength={10}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Location" value={form.location} onChange={set('location')} />
            <Input
              label="Stipend"
              value={form.stipend}
              onChange={set('stipend')}
              placeholder="₹15,000/month"
            />
            <Input label="Duration" value={form.duration} onChange={set('duration')} />
          </div>
          <Input
            label="Required skills (comma separated)"
            value={form.required_skills}
            onChange={set('required_skills')}
            placeholder="Python, Django, PostgreSQL"
          />

          {error && <Alert>{error}</Alert>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish internship'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/recruiter')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
