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
/** iOS-style on/off switch. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-[30px] w-[50px] shrink-0 rounded-full border transition disabled:opacity-50',
        checked ? 'glow border-signal/60 bg-signal' : 'border-line-strong bg-panel-3',
      )}
    >
      <span
        className={clsx(
          'absolute top-[3px] size-[22px] rounded-full shadow transition-all',
          checked ? 'left-[23px] bg-signal-ink' : 'left-[3px] bg-ink-2',
        )}
      />
    </button>
  )
}

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

/* Vial drawn in a 40 x 64 box and scaled to `size` px tall; outlines stay 1 px. */
const VIAL_W = 40
const VIAL_H = 64
const VIAL_GLASS =
  'M12 12.5V14.6C12 17.4 4 17.6 4 21.8V59Q4 62.5 7.5 62.5H32.5Q36 62.5 36 59V21.8C36 17.6 28 17.4 28 14.6V12.5Z'
const VIAL_INNER = 'M5.6 22.4V58.6Q5.6 61 8 61H32Q34.4 61 34.4 58.6V22.4Z'
const VIAL_CAP = 'M9 6.8V2.8Q9 0.8 11.2 0.8H28.8Q31 0.8 31 2.8V6.8Z'
/** Lyophilised cake: a short puck with a slightly crumbly top. */
const VIAL_CAKE = 'M5.6 54.4Q8 52.6 11 53.4T17 53T23 53.5T29 52.9T34.4 53.6V63H5.6Z'
const VIAL_LIQ_L = 5.6
const VIAL_LIQ_R = 34.4
const VIAL_LIQ_FULL = 23.6
const VIAL_LIQ_EMPTY = 61
const VIAL_MENISCUS = 1.4
const VIAL_LABEL_Y = 34
const VIAL_LABEL_H = 15
/** Paper and aluminium read light in both themes: tint white with the muted token. */
const vialPaper = (muted: number) => `color-mix(in oklab, var(--muted) ${muted}%, white)`
const vialInk = (pct: number) => `color-mix(in oklab, var(--ink) ${pct}%, transparent)`

/**
 * Lab vial: aluminium crimp with a flip-off top in the substance colour, glass neck and
 * shoulder, paper label and the liquid level with its meniscus. `state="powder"` shows
 * the lyophilised cake of an unreconstituted vial (fill is ignored); `colors` stripes the
 * liquid and splits the cap for a blend; `low` adds a warning tick.
 */
export function Vial({
  color,
  fill = 1,
  size = 34,
  className,
  state = 'liquid',
  colors,
  low = false,
}: {
  color: string
  /** Liquid left, 0..1. */
  fill?: number
  /** Height in px; the width follows the vial's proportions. */
  size?: number
  className?: string
  state?: 'liquid' | 'powder'
  /** Compounds of a blend vial, in order. Two or more stripe the liquid and the cap. */
  colors?: readonly string[]
  low?: boolean
}) {
  const id = useId().replace(/[^\w-]/g, '')
  const f = Math.max(0, Math.min(1, Number.isFinite(fill) ? fill : 0))
  const blend = colors && colors.length > 1 ? colors : null
  const detailed = size >= 44
  const level = VIAL_LIQ_EMPTY - f * (VIAL_LIQ_EMPTY - VIAL_LIQ_FULL)
  const surface = `M${VIAL_LIQ_L} ${level - VIAL_MENISCUS}Q20 ${level + VIAL_MENISCUS} ${VIAL_LIQ_R} ${level - VIAL_MENISCUS}`
  const showLiquid = state === 'liquid' && f > 0.004
  const capFill = blend ? `url(#${id}-cap)` : color
  const stripeW = blend ? (VIAL_LIQ_R - VIAL_LIQ_L) / (blend.length * 2) : 0

  return (
    <svg
      width={Math.round((size * VIAL_W) / VIAL_H)}
      height={size}
      viewBox={`0 0 ${VIAL_W} ${VIAL_H}`}
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d={VIAL_GLASS} />
        </clipPath>
        <clipPath id={`${id}-inner`}>
          <path d={VIAL_INNER} />
        </clipPath>
        <linearGradient id={`${id}-metal`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={vialPaper(62)} />
          <stop offset="0.22" stopColor={vialPaper(6)} />
          <stop offset="0.5" stopColor={vialPaper(28)} />
          <stop offset="0.8" stopColor={vialPaper(12)} />
          <stop offset="1" stopColor={vialPaper(70)} />
        </linearGradient>
        {/* round glass: darker at both edges */}
        <linearGradient id={`${id}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.1" stopColor="#000" stopOpacity="0.14" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="0.9" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        {blend && (
          <>
            <linearGradient id={`${id}-cap`} x1="0" x2="1" y1="0" y2="0">
              {/* hard stops: one segment per compound; keyed by offset, colours can repeat */}
              {blend.flatMap((c, i) => {
                const start = i / blend.length
                const end = (i + 1) / blend.length
                return [
                  <stop key={`a${start}`} offset={start} stopColor={c} />,
                  <stop key={`b${end}`} offset={end} stopColor={c} />,
                ]
              })}
            </linearGradient>
            <pattern
              id={`${id}-stripes`}
              patternUnits="userSpaceOnUse"
              x={VIAL_LIQ_L}
              y={0}
              width={stripeW * blend.length}
              height={VIAL_H}
            >
              {blend.map((c, i) => {
                const sx = i * stripeW
                return (
                  <rect key={sx} x={sx} y={0} width={stripeW + 0.05} height={VIAL_H} fill={c} />
                )
              })}
            </pattern>
          </>
        )}
      </defs>

      {/* glass: neck, shoulder and body */}
      <path d={VIAL_GLASS} fill="color-mix(in oklab, var(--panel-2) 60%, transparent)" />

      {/* contents */}
      <g clipPath={`url(#${id}-inner)`}>
        {showLiquid && (
          <>
            <g
              style={{
                filter: `drop-shadow(0 0 1.6px color-mix(in oklab, ${color} 55%, transparent))`,
              }}
            >
              <path
                d={`${surface}V63H${VIAL_LIQ_L}Z`}
                fill={blend ? `url(#${id}-stripes)` : color}
                opacity={0.9}
              />
            </g>
            <path d={`${surface}V63H${VIAL_LIQ_L}Z`} fill={`url(#${id}-depth)`} />
            <path
              d={surface}
              fill="none"
              stroke="#fff"
              strokeOpacity={0.6}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
        {state === 'powder' && (
          <>
            <path
              d={VIAL_CAKE}
              fill={vialPaper(7)}
              stroke={vialInk(22)}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <path d={VIAL_CAKE} fill={`url(#${id}-depth)`} />
            {detailed && (
              <g fill="var(--muted)" opacity={0.28}>
                <circle cx={12} cy={57} r={0.7} />
                <circle cx={16.5} cy={55.4} r={0.5} />
                <circle cx={20.5} cy={58.6} r={0.6} />
                <circle cx={27} cy={56.4} r={0.7} />
                <circle cx={30.5} cy={59} r={0.5} />
              </g>
            )}
          </>
        )}
      </g>

      {/* paper label, then the reflections on the glass over everything */}
      <g clipPath={`url(#${id}-glass)`}>
        <rect
          x={0}
          y={VIAL_LABEL_Y}
          width={VIAL_W}
          height={VIAL_LABEL_H}
          fill={vialPaper(10)}
          opacity={0.82}
        />
        {/* colour mark on the label, kept clear of the level line */}
        <rect x={8.5} y={VIAL_LABEL_Y + 4} width={4} height={7} rx={0.8} fill={capFill} />
        <line
          x1={0}
          x2={VIAL_W}
          y1={VIAL_LABEL_Y + VIAL_LABEL_H}
          y2={VIAL_LABEL_Y + VIAL_LABEL_H}
          stroke={vialInk(16)}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {detailed && (
          <g fill="var(--muted)">
            <rect x={14.5} y={38.6} width={14} height={1.7} rx={0.85} opacity={0.55} />
            <rect x={14.5} y={42.4} width={9} height={1.4} rx={0.7} opacity={0.35} />
          </g>
        )}
        {/* the level stays readable behind the label */}
        {showLiquid &&
          level > VIAL_LABEL_Y &&
          level - VIAL_MENISCUS < VIAL_LABEL_Y + VIAL_LABEL_H && (
            <path
              d={surface}
              fill="none"
              stroke={color}
              strokeWidth={1.3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        <rect x={0} y={12} width={VIAL_W} height={VIAL_H - 12} fill={`url(#${id}-shade)`} />
        <rect x={7} y={23.5} width={2} height={34} rx={1} fill="#fff" opacity={0.38} />
        <rect x={30.6} y={25} width={1} height={30} rx={0.5} fill="#fff" opacity={0.14} />
        <path
          d="M11.6 17Q9 18.6 7 20.8"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.35}
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <path
        d={VIAL_GLASS}
        fill="none"
        stroke={vialInk(32)}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />

      {/* aluminium crimp and flip-off top */}
      <rect
        x={8.2}
        y={6.2}
        width={23.6}
        height={7}
        rx={1.4}
        fill={`url(#${id}-metal)`}
        stroke={vialInk(26)}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {detailed && (
        <line
          x1={8.6}
          x2={31.4}
          y1={9.9}
          y2={9.9}
          stroke="#000"
          strokeOpacity={0.14}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <rect x={8.6} y={12} width={22.8} height={1} fill="#000" opacity={0.12} />
      <path
        d={VIAL_CAP}
        fill={capFill}
        stroke={vialInk(20)}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <rect x={10.6} y={1.7} width={18.8} height={1.3} rx={0.65} fill="#fff" opacity={0.4} />
      <rect x={9} y={5.3} width={22} height={1.5} fill="#000" opacity={0.16} />

      {low && (
        <g>
          <circle
            cx={34.6}
            cy={5.4}
            r={5.2}
            fill="var(--warn)"
            stroke="var(--panel)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <rect x={33.95} y={2.5} width={1.3} height={3.6} rx={0.65} fill="var(--panel)" />
          <circle cx={34.6} cy={8.1} r={0.8} fill="var(--panel)" />
        </g>
      )}
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
