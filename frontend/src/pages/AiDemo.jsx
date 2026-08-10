import { useState } from 'react'
import { analyzeResume, getRecommendations, matchResumeToJob } from '../services/aiService'

const MODES = {
  'resume-analysis': {
    label: 'Resume Analysis',
    placeholder: 'Paste resume text here...',
    run: (text) => analyzeResume(text),
  },
  recommendations: {
    label: 'Career Recommendations',
    placeholder: 'Describe the student profile (branch, skills, interests)...',
    run: (text) => getRecommendations({ raw_text: text }),
  },
  match: {
    label: 'Resume ↔ Job Match',
    placeholder: 'Paste: resume text, then a blank line, then the job description...',
    run: (text) => {
      const [resumeText, ...rest] = text.split('\n\n')
      return matchResumeToJob(resumeText, rest.join('\n\n'))
    },
  },
}

function AiDemo() {
  const [mode, setMode] = useState('resume-analysis')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await MODES[mode].run(input)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-1">CareerSphere AI — Raw AI Playground</h1>
        <p className="text-sm text-on-surface-variant mb-4">Live calls to the Ollama (Llama 3) backed AI service.</p>

        <div className="flex gap-2 mb-4">
          {Object.entries(MODES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                mode === key
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={MODES[mode].placeholder}
            rows={8}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm font-mono text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="self-start px-4 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-md disabled:opacity-50"
          >
            {loading ? 'Asking Llama 3...' : 'Send'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-error-container/60 border border-error-container text-on-error-container text-sm">{error}</div>
        )}

        {result && (
          <pre className="mt-4 p-4 rounded-lg bg-inverse-surface text-inverse-on-surface text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

export default AiDemo
