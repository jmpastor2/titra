import type { ReactNode } from 'react'

/**
 * A progress ring: `value` 0..1 of the circle, drawn clockwise from the top. The centre takes
 * whatever is passed as children (a number, an icon). Decorative by default: put the meaning
 * in the surrounding text, or pass `label` to expose it.
 */
export function Ring({
  value,
  size = 56,
  stroke = 6,
  color = 'var(--signal)',
  track = 'var(--panel-3)',
  label,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  label?: string
  children?: ReactNode
}) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  )
}
