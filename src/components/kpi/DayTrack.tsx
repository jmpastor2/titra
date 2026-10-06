import { clsx } from 'clsx'

export interface TrackItem {
  at: Date
  color: string
  /** done: taken · next: the coming one · later: planned after it · missed: overdue and not taken */
  state: 'done' | 'next' | 'later' | 'missed'
}

const HOUR = 3_600_000
/** Markers closer than this (in % of the track, about half an hour) are drawn side by side. */
const CLUSTER = 2.2
const GAP_PX = 11

/**
 * Doses at (almost) the same time would hide each other: each cluster is fanned out around its
 * position, GAP_PX apart, so a blend's partners or two shots at 09:00 stay visible.
 */
export function spreadClusters<T extends { x: number }>(
  items: readonly T[],
): (T & { dx: number })[] {
  const sorted = [...items].sort((a, b) => a.x - b.x)
  const out: (T & { dx: number })[] = []
  let group: T[] = []
  const flush = () => {
    group.forEach((it, i) => out.push({ ...it, dx: (i - (group.length - 1) / 2) * GAP_PX }))
    group = []
  }
  for (const it of sorted) {
    const prev = group[group.length - 1]
    if (prev && it.x - prev.x >= CLUSTER) flush()
    group.push(it)
  }
  flush()
  return out
}

/**
 * The next hours on one line: a rolling window from `before` hours ago to `after` hours ahead,
 * a needle at now, clock ticks every six hours and one marker per dose in the substance's
 * colour (solid when taken, haloed when it is the next one, hollow when planned, rose when
 * missed). The window rolls with the clock, so a night dose at 01:00 sits next to the evening
 * instead of falling off the end of "today". Decoration: say what it shows in `label`.
 */
export function DayTrack({
  now,
  items,
  before = 4,
  after = 20,
  label,
  className,
}: {
  now: Date
  items: readonly TrackItem[]
  before?: number
  after?: number
  label?: string
  className?: string
}) {
  const start = now.getTime() - before * HOUR
  const span = (before + after) * HOUR
  const pos = (t: number) => ((t - start) / span) * 100
  const nowX = pos(now.getTime())

  // Clock ticks at 00, 06, 12 and 18 inside the window.
  const ticks: { x: number; text: string }[] = []
  const first = new Date(start)
  first.setMinutes(0, 0, 0)
  first.setHours(Math.ceil(first.getHours() / 6) * 6)
  for (let t = first.getTime(); t <= start + span; t += 6 * HOUR) {
    if (t < start) continue
    const h = new Date(t).getHours()
    ticks.push({ x: pos(t), text: String(h).padStart(2, '0') })
  }

  const visible = spreadClusters(
    items
      .map((it) => ({ ...it, x: pos(it.at.getTime()) }))
      .filter((it) => it.x >= 0 && it.x <= 100),
  )

  return (
    <div
      className={clsx('relative h-[46px] w-full select-none', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* track: the past part is drawn stronger than what is still to come */}
      <div className="absolute inset-x-0 top-[13px] h-[2px] rounded-full bg-panel-3" />
      <div
        className="absolute left-0 top-[13px] h-[2px] rounded-full bg-line-strong"
        style={{ width: `${nowX}%` }}
      />
      {ticks.map((t) => (
        <span
          key={t.x}
          className="absolute top-[20px] -translate-x-1/2"
          style={{ left: `${t.x}%` }}
        >
          <span className="mx-auto block h-[5px] w-px bg-line-strong" />
          <span className="readout mt-[3px] block text-[10.5px] leading-none text-muted">
            {t.text}
          </span>
        </span>
      ))}
      {/* now */}
      <span
        className="absolute top-[3px] h-[22px] w-[2px] -translate-x-1/2 rounded-full bg-ink"
        style={{ left: `${nowX}%` }}
      />
      {visible.map((it, i) => (
        <span
          key={i}
          data-state={it.state}
          className="absolute top-[14px] size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `calc(${it.x}% + ${it.dx}px)`,
            background: it.state === 'done' || it.state === 'next' ? it.color : 'var(--panel)',
            boxShadow:
              it.state === 'next'
                ? `0 0 0 4px color-mix(in oklab, ${it.color} 28%, transparent)`
                : it.state === 'later'
                  ? `inset 0 0 0 2px ${it.color}`
                  : it.state === 'missed'
                    ? 'inset 0 0 0 2px var(--danger)'
                    : '0 0 0 2px var(--panel)',
          }}
        />
      ))}
    </div>
  )
}
