import { useEffect, useState } from 'react'
import { AiChip, Alert, Badge, Button, Card, Icon, SectionTitle, Spinner } from '../../components/ui'
import { getDailyMockTests, submitMockTest } from '../../services/learningService'

export default function DailyMockTest() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTest, setActiveTest] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getDailyMockTests()
      .then((data) => {
        setTests(data)
        if (data?.length) setActiveTest(data[0])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleOptionSelect(qIdx, optionIdx) {
    setAnswers({ ...answers, [qIdx]: optionIdx })
  }

  async function handleSubmit() {
    if (!activeTest) return
    setSubmitting(true)
    setError('')
    try {
      const res = await submitMockTest(activeTest.id, answers)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="Loading daily technical mock quizzes..." />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Daily Skill Practice & Mock Tests</h1>
            <AiChip>Daily Quiz</AiChip>
          </div>
          <p className="text-sm text-on-surface-variant">
            Solve daily technical multiple-choice questions to boost your XP, earn skill mastery badges, and improve recommendation match scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="amber">🔥 3 Day Practice Streak</Badge>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Test List Sidebar */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-outline">Available Daily Quizzes</h3>
          {tests.map((test) => (
            <Card
              key={test.id}
              onClick={() => {
                setActiveTest(test)
                setAnswers({})
                setResult(null)
              }}
              className={`cursor-pointer transition-all ${
                activeTest?.id === test.id
                  ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary/20'
                  : 'hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge tone="primary">{test.skill_category}</Badge>
                <span className="text-xs text-outline">{test.questions?.length || 0} Questions</span>
              </div>
              <h4 className="mt-2 font-bold text-on-surface text-sm">{test.title}</h4>
            </Card>
          ))}
        </div>

        {/* Quiz Workspace */}
        {activeTest ? (
          <Card className="flex flex-col gap-6 p-6">
            <SectionTitle
              title={activeTest.title}
              subtitle={`Skill Focus: ${activeTest.skill_category} • Complete questions to earn XP points`}
            />

            {result ? (
              /* Quiz Result Feedback */
              <div className="flex flex-col gap-4">
                <div className={`rounded-xl p-6 text-center ${result.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <Icon name={result.passed ? 'emoji_events' : 'replay'} className={`!text-4xl ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <h3 className="mt-2 text-2xl font-extrabold text-on-surface">
                    {result.passed ? 'Quiz Passed! 🎉' : 'Keep Practicing!'}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    You scored <strong className="text-primary text-base">{result.score_percent}%</strong> ({result.correct_count} of {result.total_questions} correct).
                  </p>
                  <p className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    +{result.xp_earned} XP Earned & Skill Updated
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-on-surface text-sm">Question Explanations</h4>
                  {result.questions?.map((q, idx) => (
                    <div key={idx} className="rounded-lg bg-surface-container-low p-3 text-xs flex flex-col gap-1">
                      <p className="font-semibold text-on-surface">{idx + 1}. {q.question}</p>
                      <p className="text-emerald-700 font-medium">Correct Answer: {q.options[q.correct]}</p>
                      <p className="text-on-surface-variant text-[11px] italic">{q.explanation}</p>
                    </div>
                  ))}
                </div>

                <Button variant="primary" onClick={() => setResult(null)} className="self-start">
                  Retake Quiz
                </Button>
              </div>
            ) : (
              /* Questions Form */
              <div className="flex flex-col gap-6">
                {activeTest.questions?.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="flex flex-col gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4">
                    <p className="font-bold text-on-surface text-sm">
                      <span className="text-primary mr-1">Q{qIdx + 1}.</span> {q.question}
                    </p>

                    <div className="grid gap-2">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = answers[qIdx] === optIdx
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleOptionSelect(qIdx, optIdx)}
                            className={`flex items-center justify-between rounded-md border p-3 text-xs font-medium text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary-fixed/30 text-primary-dark font-bold shadow-sm'
                                : 'border-outline-variant/60 bg-surface-container-low text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${isSelected ? 'border-primary bg-primary text-white' : 'border-outline'}`}>
                              {isSelected ? '✓' : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(answers).length === 0}
                  className="self-end"
                >
                  {submitting ? 'Evaluating...' : 'Submit Answers'}
                </Button>
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  )
}
