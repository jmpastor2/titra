import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

/* ---------- Badge ---------- */
type BadgeTone = 'neutral' | 'brand' | 'accent' | 'ok' | 'warn' | 'danger'
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  brand: 'bg-brand-soft text-brand-strong',
  accent: 'bg-accent-soft text-accent',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
}
export function Badge({
  tone = 'neutral',
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tracking-wide',
        badgeTones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

/* ---------- Stat ---------- */
export function Stat({
  label,
  value,
  unit,
  hint,
  tone,
  className,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  hint?: ReactNode
  tone?: 'brand' | 'accent' | 'warn' | 'danger' | 'ok'
  className?: string
}) {
  const toneClass = {
    brand: 'text-brand-strong',
    accent: 'text-accent',
    warn: 'text-warn',
    danger: 'text-danger',
    ok: 'text-ok',
  }
  return (
    <div className={clsx('flex flex-col', className)}>
      <span className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <span
        className={clsx(
          'tabular mt-0.5 text-[26px] font-bold leading-none tracking-tight',
          tone && toneClass[tone],
        )}
      >
        {value}
        {unit && <span className="ml-1 text-[14px] font-semibold text-muted">{unit}</span>}
      </span>
      {hint && <span className="mt-1 text-[12.5px] text-muted">{hint}</span>}
    </div>
  )
}

/* ---------- Progress ring ---------- */
export function ProgressRing({
  fraction,
  size = 88,
  stroke = 9,
  children,
  tone = 'brand',
}: {
  fraction: number
  size?: number
  stroke?: number
  children?: ReactNode
  tone?: 'brand' | 'accent' | 'warn'
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const f = Math.max(0, Math.min(1, fraction))
  const color =
    tone === 'brand' ? 'var(--brand)' : tone === 'accent' ? 'var(--accent)' : 'var(--warn)'
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--surface-3)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={clsx(
        'inline-flex w-full rounded-control bg-surface-2 p-1',
        size === 'sm' ? 'h-9' : 'h-11',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              'flex-1 rounded-[9px] px-2 font-semibold transition',
              size === 'sm' ? 'text-[13px]' : 'text-[14px]',
              active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-2',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col items-center px-4 py-10 text-center', className)}>
      {icon && (
        <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-[13.5px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden />
}

/* ---------- List row ---------- */
export function Row({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 py-3 text-left',
        onClick && 'active:bg-surface-2 -mx-2 rounded-xl px-2 transition',
        className,
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {subtitle && <div className="truncate text-[13px] text-muted">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right text-[13px] text-muted">{trailing}</div>}
    </Comp>
  )
}

/* ---------- Divider ---------- */
export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-0 border-t border-line', className)} />
}

/* ---------- Section title ---------- */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-1 flex items-center justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  )
}
