import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AiChip, Alert, Badge, Button, Card, Icon, SectionTitle, Spinner } from '../../components/ui'
import { getSkillTree } from '../../services/learningService'

export default function SkillTreeRoadmap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    getSkillTree()
      .then((res) => {
        setData(res)
        if (res.nodes?.length) setSelectedNode(res.nodes[1] || res.nodes[0])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Generating your interactive Skill Tree..." />
  if (error) return <Alert>{error}</Alert>

  const statusColors = {
    mastered: 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-emerald-100',
    in_progress: 'border-sky-500 bg-sky-50 text-sky-900 shadow-sky-100',
    recommended: 'border-amber-500 bg-amber-50 text-amber-900 shadow-amber-100 ring-2 ring-amber-400/40 animate-pulse',
    available: 'border-outline-variant bg-surface-container-lowest text-on-surface',
  }

  const statusBadges = {
    mastered: { tone: 'green', label: 'Mastered' },
    in_progress: { tone: 'primary', label: 'In Progress' },
    recommended: { tone: 'amber', label: 'High-Demand Gap' },
    available: { tone: 'neutral', label: 'Available' },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Interactive Skill Tree & Roadmap</h1>
            <AiChip>Live Gap Sync</AiChip>
          </div>
          <p className="text-sm text-on-surface-variant">
            Visual competence tree dynamically synced with your profile and BPUT industry <span className="font-semibold text-amber-700">SkillGapReport</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone="green">{data?.total_skills_mastered || 0} Skills Mastered</Badge>
          <Badge tone="amber">{data?.total_hot_gaps_addressed || 0} Gaps Addressed</Badge>
        </div>
      </div>

      {/* Legend */}
      <Card className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-on-surface uppercase tracking-wider">Node Legend:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
            Mastered (In Resume)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500 bg-sky-50 px-2.5 py-1 font-semibold text-sky-800">
            In Progress (Enrolled)
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 shadow-sm">
            High-Demand Industry Gap
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1 font-medium text-on-surface-variant">
            Unlocked Node
          </span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Interactive Visual Graph Canvas */}
        <Card className="flex flex-col gap-6 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container-low/30 p-6">
          <SectionTitle
            title="Competency Tree Map"
            subtitle="Click any node to open course links, practice tests, and industry market data"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {data?.nodes?.map((node) => {
              const isSelected = selectedNode?.id === node.id
              const badge = statusBadges[node.status] || statusBadges.available

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`group relative cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    statusColors[node.status]
                  } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  {node.is_hot_demand_gap && (
                    <div className="absolute -top-2.5 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      HOT GAP
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">{node.branch}</span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-on-surface group-hover:text-primary">{node.name}</h3>

                  <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>XP Points: <strong className="tabular-nums">{node.xp_earned || 0}</strong></span>
                    <span className="font-semibold text-primary">View Details →</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Node Drawer / Detail View */}
        <div className="flex flex-col gap-4">
          {selectedNode ? (
            <Card className="flex flex-col gap-4 sticky top-6 border-l-4 border-l-primary">
              <div className="flex items-center justify-between">
                <Badge tone={statusBadges[selectedNode.status]?.tone}>{statusBadges[selectedNode.status]?.label}</Badge>
                <span className="text-xs font-mono text-outline">{selectedNode.branch}</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-on-surface">{selectedNode.name}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {selectedNode.is_hot_demand_gap
                    ? 'Identified in BPUT SkillGapReport as a top missing skill demanded by hiring recruiters.'
                    : 'Standard competency node in the BPUT engineering curriculum.'}
                </p>
              </div>

              <div className="rounded-lg bg-surface-container-low p-3 text-xs flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Prerequisites:</span>
                  <span className="font-semibold text-on-surface">
                    {selectedNode.prereqs?.length ? selectedNode.prereqs.join(', ') : 'None (Root Node)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">XP Reward:</span>
                  <span className="font-bold text-emerald-600">+100 XP</span>
                </div>
              </div>

              {selectedNode.linked_course_title && (
                <div className="rounded-lg border border-primary-fixed/60 bg-primary-fixed/15 p-3">
                  <p className="text-xs font-semibold text-primary-dark">Recommended Course:</p>
                  <p className="text-sm font-bold text-on-surface">{selectedNode.linked_course_title}</p>
                  <Link to="/student/courses" className="mt-2 inline-block">
                    <Button variant="primary" className="!py-1.5 !text-xs">
                      Go to Course →
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Link to="/student/daily-tests">
                  <Button variant="secondary" className="w-full justify-center !py-2 text-xs">
                    <Icon name="quiz" className="!text-sm" />
                    Take Daily Mock Quiz
                  </Button>
                </Link>
                <Link to="/student/profile">
                  <Button variant="ghost" className="w-full justify-center !py-2 text-xs">
                    Update Resume Profile
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <Icon name="account_tree" className="!text-4xl text-outline mb-2" />
              <p className="text-sm">Click any node on the left to inspect detailed roadmap data.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
