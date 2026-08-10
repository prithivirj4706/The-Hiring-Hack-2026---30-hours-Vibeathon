import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AiChip, Alert, Badge, Button, Card, Icon, ProgressBar, ScoreRing, Stat, Spinner } from '../../components/ui'
import { getProgramTracker } from '../../services/learningService'

export default function ProgramTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getProgramTracker()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Calculating your Program Tracker statistics..." />
  if (error) return <Alert>{error}</Alert>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Program Progress Tracker</h1>
            <AiChip>Live Progress</AiChip>
          </div>
          <p className="text-sm text-on-surface-variant">
            Comprehensive dashboard tracking your course completions, mock quiz scores, XP milestones, and overall career readiness.
          </p>
        </div>

        <Link to="/student/roadmap">
          <Button variant="primary" className="!py-2 !text-xs">
            Open Skill Tree Roadmap →
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total XP Points" value={data?.total_xp || 0} hint="Earned from courses & daily quizzes" />
        <Stat label="Completed Courses" value={`${data?.completed_courses || 0} / ${data?.enrolled_courses || 0}`} hint="Curated masterclasses" />
        <Stat label="Mock Tests Passed" value={data?.mock_tests_passed || 0} hint={`${data?.mock_tests_attempted || 0} total attempts`} />
        <Stat label="Daily Quiz Streak" value={`🔥 ${data?.daily_streak || 1} Days`} hint="Keep practicing daily!" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col gap-5">
          <h3 className="text-lg font-bold text-on-surface">Program Milestones & Progress</h3>

          <div className="flex flex-col gap-4">
            <ProgressBar value={Math.min(100, (data?.completed_courses || 1) * 25)} label="Skill Courses Completion" tone="primary" />
            <ProgressBar value={Math.min(100, (data?.mock_tests_passed || 1) * 20)} label="Mock Test Benchmark Passing Rate" tone="accent" />
            <ProgressBar value={Math.min(100, (data?.mastered_skills_count || 1) * 15)} label="Skill Tree Competency Coverage" tone="emerald" />
          </div>

          <div className="mt-4 rounded-xl bg-surface-container-low p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon name="verified" className="text-emerald-600" />
              <h4 className="font-semibold text-on-surface text-sm">Automated Resume & Profile Sync</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When you pass daily mock quizzes or complete courses, the associated skills are automatically added to your profile and reflected on your career recommendation score.
            </p>
          </div>
        </Card>

        {/* Readiness Score Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing score={data?.readiness_score || 75} hint="Driven by LLM analysis & completed skill modules" />
          <p className="mt-4 text-xs font-semibold text-on-surface-variant">
            {data?.mastered_skills_count || 0} Verified Skills on File
          </p>
        </Card>
      </div>
    </div>
  )
}
