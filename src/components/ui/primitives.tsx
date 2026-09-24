import { clsx } from 'clsx'
import { useId, type HTMLAttributes, type ReactNode } from 'react'

/* ---------- Badge ---------- */
type BadgeTone = 'neutral' | 'brand' | 'accent' | 'ok' | 'warn' | 'danger'
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-panel-2 text-ink-2 border-line',
  brand: 'bg-signal-soft text-signal border-signal/20',
  accent: 'bg-accent-soft text-accent border-accent/20',
  ok: 'bg-ok-soft text-ok border-ok/20',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
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
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em]',
        badgeTones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

/* ---------- Stat: instrument readout ---------- */
export function Stat({
  label,
  value,
  unit,
  hint,
  tone,
  size = 'md',
  className,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  hint?: ReactNode
  tone?: 'brand' | 'accent' | 'warn' | 'danger' | 'ok'
  size?: 'md' | 'lg'
  className?: string
}) {
  const toneClass = {
    brand: 'text-signal',
    accent: 'text-accent',
    warn: 'text-warn',
    danger: 'text-danger',
    ok: 'text-ok',
  }
  return (
    <div className={clsx('flex flex-col', className)}>
      {label && <span className="spec">{label}</span>}
      <span
        className={clsx(
          'readout mt-1 font-semibold leading-none',
          size === 'lg' ? 'text-[34px]' : 'text-[24px]',
          tone && toneClass[tone],
        )}
      >
        {value}
        {unit && <span className="ml-1 text-[12px] font-medium text-muted">{unit}</span>}
      </span>
      {hint && <span className="mt-1.5 text-[12.5px] text-muted">{hint}</span>}
    </div>
  )
}

/* ---------- Progress ring (gauge with a tick bezel) ---------- */
export function ProgressRing({
  fraction,
  size = 88,
  stroke = 8,
  children,
  color = 'var(--signal)',
  ticks = true,
}: {
  fraction: number
  size?: number
  stroke?: number
  children?: ReactNode
  color?: string
  ticks?: boolean
}) {
  const r = (size - stroke) / 2 - 3
  const c = 2 * Math.PI * r
  const f = Math.max(0, Math.min(1, fraction))
  const cx = size / 2
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {ticks &&
          Array.from({ length: 40 }, (_, i) => {
            const a = (i / 40) * 2 * Math.PI
            const r1 = size / 2 - 0.5
            const r2 = r1 - (i % 5 === 0 ? 3 : 1.5)
            return (
              <line
                key={i}
                x1={cx + r1 * Math.cos(a)}
                y1={cx + r1 * Math.sin(a)}
                x2={cx + r2 * Math.cos(a)}
                y2={cx + r2 * Math.sin(a)}
                stroke="var(--line-strong)"
                strokeWidth={1}
              />
            )
          })}
        <circle cx={cx} cy={cx} r={r} stroke="var(--panel-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          style={{
            transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)',
            filter: `drop-shadow(0 0 5px color-mix(in oklab, ${color} 55%, transparent))`,
          }}
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
        'inline-flex w-full rounded-full border border-line bg-panel-2 p-1',
        size === 'sm' ? 'h-10' : 'h-11',
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
              'min-w-0 flex-1 truncate rounded-full px-2 font-semibold transition',
              size === 'sm' ? 'text-[12.5px]' : 'text-[14px]',
              active
                ? 'bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                : 'text-muted hover:text-ink-2',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Chip (filter / toggle) ---------- */
export function Chip({
  active,
  onClick,
  children,
  color,
  className,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  /** Substance colour for the leading dot. */
  color?: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition',
        active
          ? 'border-signal/40 bg-signal-soft text-ink'
          : 'border-line bg-panel text-ink-2 hover:border-line-strong',
        className,
      )}
    >
      {color && <SubstanceDot color={color} />}
      {children}
    </button>
  )
}

/* ---------- Substance identity ---------- */
export function SubstanceDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 8px color-mix(in oklab, ${color} 70%, transparent)`,
      }}
    />
  )
}

/** Stylised vial whose liquid level shows what is left. */
export function Vial({
  color,
  fill = 1,
  size = 34,
  className,
}: {
  color: string
  fill?: number
  size?: number
  className?: string
}) {
  const clipId = useId()
  const f = Math.max(0, Math.min(1, fill))
  const h = size
  const w = Math.round(size * 0.62)
  const bodyTop = h * 0.3
  const bodyH = h - bodyTop - 1.5
  const level = bodyTop + bodyH * (1 - f)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x={1.5} y={bodyTop} width={w - 3} height={bodyH} rx={w * 0.22} />
        </clipPath>
      </defs>
      <rect
        x={w * 0.2}
        y={0.5}
        width={w * 0.6}
        height={h * 0.13}
        rx={2}
        fill="var(--panel-3)"
        stroke="var(--line-strong)"
      />
      <rect x={w * 0.3} y={h * 0.14} width={w * 0.4} height={h * 0.16} fill="var(--line-strong)" />
      <rect
        x={1.5}
        y={bodyTop}
        width={w - 3}
        height={bodyH}
        rx={w * 0.22}
        fill="var(--panel-2)"
        stroke="var(--line-strong)"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={level} width={w} height={h} fill={color} opacity={0.9} />
        <rect x={0} y={level} width={w} height={1.2} fill="white" opacity={0.35} />
      </g>
    </svg>
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
        <div className="glow mb-4 grid size-14 place-items-center rounded-2xl border border-signal/25 bg-signal-soft text-signal">
          {icon}
        </div>
      )}
      <h3 className="font-display text-[17px] font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-[13.5px] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
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
        onClick && '-mx-2 w-[calc(100%+1rem)] rounded-xl px-2 transition active:bg-panel-2',
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

/* ---------- Section title: silkscreen label with an index ---------- */
export function SectionTitle({
  children,
  index,
  action,
}: {
  children: ReactNode
  index?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-2.5 mt-2 flex items-center justify-between px-1">
      <h2 className="spec flex items-center gap-2">
        {index && <span className="text-signal">{index}</span>}
        <span>{children}</span>
      </h2>
      {action}
    </div>
  )
}
