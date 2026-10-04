import { clsx } from 'clsx'
import type { CSSProperties } from 'react'
import type { TrackCell } from './view'

type Segment = Exclude<TrackCell, { kind: 'more' }>

/** The colour at `pct` percent, so one substance colour paints every state. */
const mix = (color: string, pct: number) => `color-mix(in oklab, ${color} ${pct}%, transparent)`

function look(c: Segment, color: string): CSSProperties {
  const lit = c.state === 'current'
  const edge = `1px solid ${mix(color, lit ? 100 : 45)}`
  const glow = lit ? `0 0 10px ${mix(color, 80)}` : undefined
  if (c.kind === 'week' && c.rest) {
    // A week of rest: hatched, so it reads as "no dose" in any state.
    const stripe = mix(color, c.state === 'future' ? 40 : 80)
    return {
      backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 2px, transparent 2px 4px)`,
      border: edge,
      boxShadow: glow,
    }
  }
  if (c.kind === 'open') {
    // Open-ended: it fades out to the right, there is no last week to count.
    const fill = c.state === 'future' ? 22 : c.state === 'current' ? 100 : 75
    return {
      backgroundImage: `linear-gradient(90deg, ${mix(color, fill)}, transparent)`,
      borderTop: edge,
      borderBottom: edge,
      borderLeft: edge,
      boxShadow: glow,
    }
  }
  if (c.state === 'done') return { background: mix(color, 75) }
  if (c.state === 'current') return { background: color, boxShadow: glow }
  return { border: edge }
}

/**
 * One segment per week of the plan: done filled, this week lit, the weeks ahead outlined and
 * the weeks of rest hatched. The first week of each dose step is set a little apart, so the
 * groups read as steps. A long plan shows "+N" for the weeks it leaves out.
 */
export function WeekTrack({
  cells,
  color,
  label,
  className,
}: {
  cells: readonly TrackCell[]
  color: string
  /** What a screen reader says for the whole track; without it the track is decorative. */
  label?: string
  className?: string
}) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx('flex h-3.5 items-center gap-[3px]', className)}
    >
      {cells.map((c, i) =>
        c.kind === 'more' ? (
          <span
            key={`more-${c.state}`}
            className="readout shrink-0 px-0.5 text-[10px] font-semibold text-muted"
          >
            +{c.count}
          </span>
        ) : (
          <span
            key={c.kind === 'week' ? c.n : 'open'}
            style={look(c, color)}
            className={clsx(
              'block min-w-[5px] rounded-[3px]',
              c.kind === 'open' ? 'max-w-24 flex-[2]' : 'flex-1',
              c.state === 'current' ? 'h-3.5' : 'h-2',
              c.kind === 'week' && c.stepStart && i > 0 && 'ml-[3px]',
            )}
          />
        ),
      )}
    </span>
  )
}
