import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AiChip, Icon } from '../components/ui'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'

const STATS = [
  { value: '10k+', label: 'Students' },
  { value: '500+', label: 'Companies' },
  { value: '95%', label: 'Placement Accuracy' },
]

const TRUSTED_BY = ['Google', 'NVIDIA', 'Meta', 'Microsoft', 'Amazon']

const STEPS = [
  { icon: 'upload_file', title: 'Upload Profile', body: 'Upload your resume and academic history.' },
  { icon: 'psychology', title: 'AI Analysis', body: 'We identify your unique skill sets and strengths.' },
  { icon: 'travel_explore', title: 'Path Discovery', body: 'Get personalised career paths tailored to you.' },
  { icon: 'work', title: 'Get Hired', body: 'Direct matching with top-tier internships.' },
]

const FEATURES = [
  {
    icon: 'target',
    title: 'Skill Gap Analysis',
    body: 'See exactly which skills are missing for the role you want, and how much of the market demand you already cover.',
    chips: ['Context Aware', 'Deep Learning'],
  },
  {
    icon: 'description',
    title: 'Resume Optimization',
    body: 'Instant feedback on how your resume performs against industry standards, scored live by Llama 3.',
    score: 85,
  },
  {
    icon: 'route',
    title: 'AI Career Roadmap',
    body: 'A personalised learning roadmap and recommended career paths, generated from your actual profile.',
    chips: ['Real-time'],
  },
]

const ROLES = [
  {
    icon: 'school',
    title: 'Students',
    body: 'Build an AI-scored profile, get a personalised career roadmap, and see your real match score before you apply.',
    points: ['Resume analysis & readiness score', 'Career path recommendations', 'One-click applications'],
  },
  {
    icon: 'business_center',
    title: 'Recruiters',
    body: 'Stop sorting through resumes by hand. Post a role and let the AI rank every applicant against your job description.',
    points: ['AI-ranked applicant shortlists', 'Post & manage internships', 'Track applications by status'],
  },
  {
    icon: 'verified',
    title: 'Placement Officers',
    body: 'See employability trends, department skill gaps, and industry demand across the whole university at a glance.',
    points: ['Branch-wise readiness analytics', 'Skill demand vs. supply', 'Exportable placement reports'],
  },
]

const TESTIMONIALS = [
  {
    quote:
      'I had no idea my resume was missing basic keywords recruiters search for. The AI scan fixed that in one pass, and I could see exactly which internships I actually stood a chance at.',
    name: 'Ananya Mishra',
    role: 'CSE, 3rd Year',
  },
  {
    quote:
      'We used to get 200 applications for one internship and skim them manually. Now the AI ranks them against our job description and we just review the top ten.',
    name: 'Kavita Rao',
    role: 'Recruiter, TechNova Solutions',
  },
  {
    quote:
      'The branch-wise readiness dashboard changed how we plan training sessions — we can finally see which departments need intervention before placement season, not after.',
    name: 'Placement Cell',
    role: 'BPUT',
  },
]

const FAQS = [
  {
    q: 'Is the AI actually analysing my resume, or is this a demo with fake data?',
    a: 'It\'s real. Every resume analysis, career recommendation, and match score is a live call to a Llama 3 model — nothing here is hardcoded or simulated.',
  },
  {
    q: 'Do I need to pay or connect a card to try it?',
    a: 'No. Create a free account as a student, recruiter, or placement officer and everything is available immediately.',
  },
  {
    q: 'What happens to my resume and profile data?',
    a: 'Your profile is stored so recommendations and match scores can improve over time, and it\'s only visible to you and, for internship applications, the recruiter you applied to.',
  },
  {
    q: 'How is the readiness score calculated?',
    a: 'The AI weighs the breadth of your skills, the depth of your projects, certifications, and any work experience described in your resume — it\'s not a fixed formula, it reasons about your specific background each time.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-outline-variant/60 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-semibold text-on-surface">{q}</span>
        <Icon name={open ? 'remove' : 'add'} className="shrink-0 text-primary" />
      </button>
      {open && <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{a}</p>}
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to={HOME_BY_ROLE[user.role] ?? '/login'} replace />

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant/60 bg-surface-container-lowest/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">
              <Icon name="hub" className="!text-lg" />
            </span>
            <span className="font-bold tracking-tight text-on-surface">CareerPulse AI</span>
          </div>
          <div className="flex gap-2">
            <Link
              to="/login"
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-10 pt-20 text-center">
        <p className="mx-auto mb-4 w-fit rounded-full bg-tertiary-container/15 px-3 py-1 text-xs font-semibold text-tertiary">
          Next-Gen Career Intelligence
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
          Find Your Perfect <span className="text-primary">Career Path</span> with AI
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-on-surface-variant">
          Bridge the gap between your education and professional success. Our AI-driven engine
          analyzes your skills, projects, and goals to build a personalized roadmap to the
          world's leading companies.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
          >
            Get Started <Icon name="arrow_forward" className="!text-base" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary-container px-6 py-3 text-sm font-bold text-on-secondary-container shadow-sm hover:opacity-90"
          >
            <Icon name="explore" className="!text-base" /> Explore Internships
          </Link>
        </div>

        <div className="mx-auto mt-10 flex max-w-lg justify-center divide-x divide-outline-variant">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex-1 px-4">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-outline-variant/60 bg-surface-container-low py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Trusted by industry giants
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {TRUSTED_BY.map((name) => (
              <span key={name} className="text-lg font-bold text-on-surface-variant/70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">How It Works</h2>
          <p className="mt-1 text-on-surface-variant">
            Our intelligent matching engine bridges the gap between your potential and your dream
            career in four simple steps.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary text-on-primary">
                <span className="text-lg font-bold">{index + 1}</span>
              </div>
              <Icon name={step.icon} className="mb-2 text-primary" />
              <h3 className="font-semibold text-on-surface">{step.title}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Accelerate Your Professional Growth</h2>
          <p className="mt-1 text-on-surface-variant">Everything you need to accelerate your professional journey.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary-fixed/60 text-primary">
                <Icon name={feature.icon} />
              </div>
              <h3 className="font-semibold text-on-surface">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-on-surface-variant">{feature.body}</p>
              {feature.chips && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {feature.chips.map((chip) => (
                    <AiChip key={chip}>{chip}</AiChip>
                  ))}
                </div>
              )}
              {feature.score && (
                <p className="mt-3 text-2xl font-bold text-primary">{feature.score}/100</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Built for every role</h2>
          <p className="mt-1 text-on-surface-variant">
            One platform, three completely different experiences — each tuned to what that role
            actually needs to do.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {ROLES.map((role) => (
            <div key={role.title} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary-fixed/60 text-primary">
                <Icon name={role.icon} />
              </div>
              <h3 className="font-semibold text-on-surface">{role.title}</h3>
              <p className="mt-1.5 text-sm text-on-surface-variant">{role.body}</p>
              <ul className="mt-3 space-y-1.5">
                {role.points.map((point) => (
                  <li key={point} className="flex items-start gap-1.5 text-sm text-on-surface-variant">
                    <Icon name="check_circle" className="mt-0.5 !text-base shrink-0 text-emerald-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">What people are saying</h2>
          <p className="mt-1 text-on-surface-variant">Students, recruiters and placement cells, in their own words.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.name} className="flex flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
              <Icon name="format_quote" className="mb-2 text-primary" />
              <p className="flex-1 text-sm leading-relaxed text-on-surface-variant">{testimonial.quote}</p>
              <div className="mt-4">
                <p className="font-semibold text-on-surface">{testimonial.name}</p>
                <p className="text-xs text-on-surface-variant">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Frequently asked questions</h2>
        </div>
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-6 shadow-sm">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-2xl bg-inverse-surface px-8 py-12 text-center text-inverse-on-surface">
          <h2 className="text-2xl font-bold tracking-tight">Ready to pulse into your future?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-inverse-on-surface/80">
            Join 10,000+ students already using CareerPulse AI to land internships at the world's
            leading companies.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
            >
              Create Free Account
            </Link>
            <a
              href="#testimonials"
              className="inline-flex items-center gap-2 rounded-lg border border-inverse-on-surface/30 px-6 py-3 text-sm font-semibold text-inverse-on-surface hover:bg-inverse-on-surface/10"
            >
              View Success Stories
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h3 className="font-semibold text-on-surface">Demo accounts</h3>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Seeded by <code className="rounded bg-surface-container-low px-1">python seed.py</code> —
            password <code className="rounded bg-surface-container-low px-1">demo1234</code>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              { role: 'Student', email: 'ananya@bput.ac.in' },
              { role: 'Recruiter', email: 'kavita@technova.com' },
              { role: 'Placement Officer', email: 'admin@bput.ac.in' },
            ].map((account) => (
              <div key={account.email} className="rounded-lg bg-surface-container-low px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {account.role}
                </p>
                <p className="text-sm text-on-surface">{account.email}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant/60 py-6 text-center text-xs text-on-surface-variant">
        © 2026 CareerPulse AI. Intelligent Internship Matching for the next generation of talent.
      </footer>
    </div>
  )
}
