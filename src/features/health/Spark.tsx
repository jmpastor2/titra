/**
 * Tiny readouts for the summary tiles: a sparkline for a value over time and a strip of
 * day cells for "did I log / dose that day". Plain SVG and divs, no chart library.
 */
import { clsx } from 'clsx'
import type { DayCell, DayMark } from './consistency'
import { SPARK_H, sparkY } from './sparkline'

/** Line of values; the last value gets a dot. */
export function Sparkline({
  values,
  color = 'var(--signal)',
  height = 28,
  minSpan = 0,
  className,
}: {
  values: readonly number[]
  color?: string
  height?: number
  /** The least range the height stands for, in the unit of `values`. */
  minSpan?: number
  className?: string
}) {
  if (values.length < 2) {
    return <div className={className} style={{ height }} aria-hidden />
  }
  const xs = values.map((_, i) => (i / (values.length - 1)) * 100)
  const ys = sparkY(values, minSpan)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${ys[i]!.toFixed(2)}`).join(' ')
  const lastY = ys[ys.length - 1]!
  return (
    <div className={clsx('relative', className)} style={{ height }} aria-hidden>
      <svg
        viewBox={`0 0 100 ${SPARK_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        <path
          d={`${d} L100,${SPARK_H} L0,${SPARK_H} Z`}
          fill={`color-mix(in oklab, ${color} 12%, transparent)`}
          stroke="none"
        />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-panel"
        style={{ left: '100%', top: `${lastY}%`, background: color }}
      />
    </div>
  )
}

const MARK_CLASS: Record<DayMark, string> = {
  full: 'bg-signal',
  partial: 'bg-[color-mix(in_oklab,var(--signal)_45%,var(--panel-3))]',
  missed:
    'bg-danger-soft shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_55%,transparent)]',
  none: 'bg-panel-3',
}

/**
 * One cell per day, oldest first, today last and outlined. `label` is the accessible
 * summary ("3 of 14 days"), since the cells themselves are decoration.
 */
export function DayStrip({
  cells,
  label,
  height = 10,
  className,
}: {
  cells: readonly DayCell[]
  label: string
  height?: number
  className?: string
}) {
  const gap = cells.length > 14 ? 1.5 : 3
  const last = cells[cells.length - 1]
  return (
    <div role="img" aria-label={label} className={clsx('flex', className)} style={{ gap }}>
      {cells.map((c) => (
        <span
          key={c.day.getTime()}
          className={clsx(
            'min-w-0 flex-1 rounded-[2px]',
            MARK_CLASS[c.mark],
            c === last && 'outline outline-1 outline-offset-1 outline-line-strong',
          )}
          style={{ height }}
        />
      ))}
    </div>
  )
}
