export function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

export function Card({ children, className = '', glass = false }) {
  return (
    <div
      className={`rounded-xl p-5 ${
        glass
          ? 'glass-card'
          : 'border border-outline-variant/60 bg-surface-container-lowest shadow-sm'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-on-surface">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-on-primary shadow-sm hover:opacity-90',
  secondary:
    'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low',
  amber: 'bg-secondary-container text-on-secondary-container shadow-sm hover:opacity-90',
  ghost: 'bg-transparent text-primary border border-primary hover:bg-primary-fixed/40',
  danger:
    'bg-surface-container-lowest text-error border border-error-container hover:bg-error-container/40',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold
        transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50
        ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Input({ label, action, className = '', ...props }) {
  return (
    <label className="block">
      {(label || action) && (
        <div className="mb-1 flex items-center justify-between">
          {label && <span className="text-sm font-medium text-on-surface">{label}</span>}
          {action}
        </div>
      )}
      <input
        className={`w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm
          text-on-surface outline-none transition-all placeholder:text-outline
          focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-on-surface">{label}</span>}
      <textarea
        className={`w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm
          text-on-surface outline-none transition-all placeholder:text-outline
          focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-on-surface">{label}</span>}
      <select
        className={`w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm
          text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-surface-container-high text-on-surface-variant',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-secondary-container/80 text-on-secondary-container',
    red: 'bg-error-container text-on-error-container',
    primary: 'bg-primary-fixed text-primary-dark',
    ai: 'bg-tertiary-container/15 text-tertiary font-medium',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

/** Pill-shaped AI-generated content marker, matching the "Match Score" chip style from the Stitch export. */
export function AiChip({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-container/15 px-3 py-1 text-xs font-semibold text-tertiary">
      <Icon name="auto_awesome" className="!text-sm" />
      {children}
    </span>
  )
}

export function Alert({ children, tone = 'error' }) {
  if (!children) return null
  const tones = {
    error: 'bg-error-container/60 border-error-container text-on-error-container',
    warning: 'bg-secondary-container/30 border-secondary-container text-on-secondary-container',
    info: 'bg-primary-fixed/50 border-primary-fixed text-primary-dark',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  }
  return <div className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>{children}</div>
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
      {label}
    </div>
  )
}

export function Stat({ label, value, hint }) {
  return (
    <Card>
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-on-surface">{value}</p>
      {hint && <p className="mt-1 text-xs text-outline">{hint}</p>}
    </Card>
  )
}

export function ScoreRing({ score, size = 140, label = 'Career Readiness', hint }) {
  const value = Math.max(0, Math.min(100, score ?? 0))
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const verdict = score == null ? '' : value >= 80 ? 'EXCELLENT' : value >= 60 ? 'GOOD' : value >= 40 ? 'FAIR' : 'NEEDS WORK'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-container-high)" strokeWidth="10" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (value / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 700ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-primary">{score == null ? '—' : `${value}%`}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {verdict}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-on-surface">{label}</p>
      {hint && <p className="mt-0.5 max-w-[16rem] text-center text-xs text-on-surface-variant">{hint}</p>}
    </div>
  )
}

export function ProgressBar({ value, label, tone = 'primary' }) {
  const tones = { primary: 'bg-primary', accent: 'bg-tertiary', emerald: 'bg-emerald-500' }
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-on-surface">{label}</span>
          <span className="font-semibold tabular-nums text-on-surface-variant">{value}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div
          className={`h-full rounded-full ${tones[tone]} transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

export function TagList({ items, tone = 'neutral', empty = 'None yet' }) {
  if (!items?.length) return <p className="text-sm text-outline">{empty}</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <Badge key={`${item}-${index}`} tone={tone}>
          {item}
        </Badge>
      ))}
    </div>
  )
}
