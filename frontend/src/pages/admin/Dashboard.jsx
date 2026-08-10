import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Alert, Card, SectionTitle, Spinner, Stat } from '../../components/ui'
import { getBranches, getOverview, getSkills } from '../../services/analyticsService'

const STATUS_COLORS = {
  applied: '#94a3b8',
  shortlisted: '#6366f1',
  hired: '#059669',
  rejected: '#dc2626',
}

function exportCsv(rows, filename) {
  if (!rows?.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [branches, setBranches] = useState([])
  const [skills, setSkills] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getOverview(), getBranches(), getSkills()])
      .then(([o, b, s]) => {
        setOverview(o)
        setBranches(b)
        setSkills(s)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Crunching placement analytics..." />
  if (error) return <Alert>{error}</Alert>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">University Analytics</h1>
        <p className="text-sm text-on-surface-variant">
          Employability trends, department skill gaps and industry demand across BPUT.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Students" value={overview.totals.students} hint={`${overview.profiles_analyzed} AI-analysed`} />
        <Stat label="Open internships" value={overview.totals.internships} hint={`${overview.totals.recruiters} recruiters`} />
        <Stat label="Applications" value={overview.totals.applications} />
        <Stat
          label="Avg readiness"
          value={overview.avg_readiness_score || '—'}
          hint={`Placement rate ${overview.placement_rate}%`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Branch-wise readiness"
            subtitle="Average AI career readiness score per department"
            action={
              <button
                onClick={() => exportCsv(branches, 'branch-readiness.csv')}
                className="text-sm font-medium text-primary hover:underline"
              >
                Export CSV
              </button>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={branches}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_readiness" name="Avg readiness" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="students" name="Students" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle title="Application funnel" subtitle="Where candidates stand today" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={overview.application_status}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {overview.application_status.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Skill demand vs student supply"
          subtitle="Skills employers ask for, against how many students actually have them"
          action={
            <button
              onClick={() => exportCsv(skills.skill_gaps, 'skill-gaps.csv')}
              className="text-sm font-medium text-primary hover:underline"
            >
              Export CSV
            </button>
          }
        />
        {skills.skill_gaps.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No internship skill requirements recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={skills.skill_gaps} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="skill" width={110} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="demand" name="Employer demand" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              <Bar dataKey="supply" name="Students with skill" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Top student skills" />
          <ul className="divide-y divide-outline-variant/60 text-sm">
            {skills.top_student_skills.map((row) => (
              <li key={row.skill} className="flex justify-between py-2">
                <span className="text-on-surface">{row.skill}</span>
                <span className="font-medium text-on-surface">{row.count}</span>
              </li>
            ))}
            {skills.top_student_skills.length === 0 && (
              <li className="py-2 text-outline">No skills recorded yet</li>
            )}
          </ul>
        </Card>

        <Card>
          <SectionTitle title="Branch breakdown" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wide text-on-surface-variant">
                  <th className="py-2">Branch</th>
                  <th className="py-2">Students</th>
                  <th className="py-2">Analysed</th>
                  <th className="py-2">Avg readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {branches.map((row) => (
                  <tr key={row.branch}>
                    <td className="py-2 text-on-surface">{row.branch}</td>
                    <td className="py-2 text-on-surface-variant">{row.students}</td>
                    <td className="py-2 text-on-surface-variant">{row.analyzed}</td>
                    <td className="py-2 font-medium text-on-surface">{row.avg_readiness || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
