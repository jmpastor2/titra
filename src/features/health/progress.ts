/**
 * Progress maths: time ranges (1 m / 3 m / 6 m / current cycle), change since the start
 * of a range, calendar-month means and the protocol timeline drawn over the charts.
 * Pure functions; callers pass `now`.
 */
import {
  addMonths,
  endOfDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'
import type { ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { stepWindows } from '@/domain/dosing/schedule'
import { stepChanges, type StepChange } from '@/features/exposure/chartScale'
import { fmtNumber, type Locale } from '@/lib/format'

const DAY_MS = 86_400_000

export type ProgressRange = '1m' | '3m' | '6m' | 'cycle'

export interface TimePoint {
  at: Date
  value: number
}

export interface TimeWindow {
  from: Date
  to: Date
}

/** Start of the current cycle: the earliest start date among active protocols. */
export function cycleStart(protocols: readonly ProtocolRow[]): Date | null {
  let best: Date | null = null
  for (const p of protocols) {
    if (p.status !== 'active') continue
    const d = startOfDay(parseISO(p.start_date))
    if (Number.isNaN(d.getTime())) continue
    if (!best || d < best) best = d
  }
  return best
}

/**
 * The visible window for a range, ending tonight so a check-in logged after the screen
 * opened still shows. "Cycle" runs from the cycle start (falling back to 3 months) and is
 * never shorter than two weeks, so a fresh cycle still has context.
 */
export function rangeWindow(range: ProgressRange, now: Date, cycle: Date | null): TimeWindow {
  const to = endOfDay(now)
  switch (range) {
    case '1m':
      return { from: subMonths(now, 1), to }
    case '6m':
      return { from: subMonths(now, 6), to }
    case 'cycle': {
      if (!cycle) return { from: subMonths(now, 3), to }
      const minFrom = subDays(now, 14)
      return { from: cycle < minFrom ? cycle : minFrom, to }
    }
    case '3m':
    default:
      return { from: subMonths(now, 3), to }
  }
}

export function sortPoints(points: readonly TimePoint[]): TimePoint[] {
  return points.toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

export function inWindow(points: readonly TimePoint[], w: TimeWindow): TimePoint[] {
  return points.filter((p) => p.at >= w.from && p.at <= w.to)
}

function mean(points: readonly TimePoint[]): number {
  return points.reduce((s, p) => s + p.value, 0) / points.length
}

export interface Change {
  baseline: number
  current: number
  delta: number
  firstAt: Date
  lastAt: Date
}

/**
 * Change from the first to the last week of readings on or after `from`. Averaging a
 * week at each end keeps a single good or bad day from dominating. Needs two readings
 * on different days; when everything falls inside one week it compares first and last.
 */
export function changeSince(
  points: readonly TimePoint[],
  from: Date,
  windowDays = 7,
): Change | null {
  const pts = sortPoints(points.filter((p) => p.at >= from))
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (!first || !last || pts.length < 2) return null
  const spanMs = last.at.getTime() - first.at.getTime()
  if (spanMs < DAY_MS / 2) return null
  const w = windowDays * DAY_MS
  const [head, tail] =
    spanMs < 2 * w
      ? [[first], [last]]
      : [
          pts.filter((p) => p.at.getTime() < first.at.getTime() + w),
          pts.filter((p) => p.at.getTime() > last.at.getTime() - w),
        ]
  const baseline = mean(head)
  const current = mean(tail)
  return { baseline, current, delta: current - baseline, firstAt: first.at, lastAt: last.at }
}

export interface MonthMean {
  /** Local first day of the month. */
  month: Date
  mean: number | null
  n: number
}

/** Mean per calendar month over the window, oldest first; empty months have mean null. */
export function monthlyMeans(points: readonly TimePoint[], w: TimeWindow): MonthMean[] {
  const out: MonthMean[] = []
  const last = startOfMonth(w.to)
  for (let m = startOfMonth(w.from); m <= last; m = addMonths(m, 1)) {
    const next = addMonths(m, 1)
    const inMonth = points.filter((p) => p.at >= m && p.at < next && p.at >= w.from && p.at <= w.to)
    out.push({ month: m, mean: inMonth.length ? mean(inMonth) : null, n: inMonth.length })
  }
  return out
}

export interface LaneSegment {
  start: Date
  end: Date
  doseMg: number
  pause: boolean
  index: number
}

export interface ProtocolLane {
  id: string
  compoundId: string
  name: string
  unit: string
  segments: LaneSegment[]
  changes: StepChange[]
  /** Largest dose over the whole protocol, to shade steps relative to it. */
  maxDoseMg: number
}

/** Active protocols as step segments clipped to the window, earliest start first. */
export function protocolLanes(protocols: readonly ProtocolRow[], w: TimeWindow): ProtocolLane[] {
  return protocols
    .filter((p) => p.status === 'active')
    .toSorted((a, b) => a.start_date.localeCompare(b.start_date))
    .flatMap((row): ProtocolLane[] => {
      const like = toProtocolLike(row)
      if (like.steps.length === 0) return []
      const windows = stepWindows(like)
      const segments = windows.flatMap((sw): LaneSegment[] => {
        const start = sw.start > w.from ? sw.start : w.from
        const endRaw = sw.end ?? w.to
        const end = endRaw < w.to ? endRaw : w.to
        if (!(end > start)) return []
        const pause = Boolean(sw.step.pause)
        return [{ start, end, doseMg: pause ? 0 : sw.step.doseMg, pause, index: sw.index }]
      })
      if (segments.length === 0) return []
      return [
        {
          id: row.id,
          compoundId: row.compound_id,
          name: row.name,
          unit: row.unit,
          segments,
          changes: stepChanges(like, w.from, w.to),
          maxDoseMg: Math.max(0, ...like.steps.map((s) => (s.pause ? 0 : s.doseMg))),
        },
      ]
    })
}

/** The step that covers most of [from, to) in a lane, or null when the lane is absent. */
export function dominantSegment(lane: ProtocolLane, from: Date, to: Date): LaneSegment | null {
  let best: LaneSegment | null = null
  let bestMs = 0
  for (const s of lane.segments) {
    const ms = Math.min(s.end.getTime(), to.getTime()) - Math.max(s.start.getTime(), from.getTime())
    if (ms > bestMs) {
      best = s
      bestMs = ms
    }
  }
  return best
}

/** Position of an instant inside the window as a 0–1 fraction (clamped). */
export function fractionOf(at: Date, w: TimeWindow): number {
  const span = w.to.getTime() - w.from.getTime()
  if (!(span > 0)) return 0
  return Math.min(1, Math.max(0, (at.getTime() - w.from.getTime()) / span))
}

/** Whether lower values are an improvement for a kind (weight loss), higher, or neither. */
export function polarity(kind: string): 'higher' | 'lower' | 'neutral' {
  switch (kind) {
    case 'energy':
    case 'sleep_quality':
    case 'mood':
    case 'recovery':
    case 'focus':
    case 'libido':
    case 'lean_mass':
      return 'higher'
    case 'weight':
    case 'waist':
    case 'body_fat_pct':
    case 'glucose_fasting':
    case 'hba1c':
      return 'lower'
    default:
      // Appetite is wanted lower on a GLP-1 and higher in recovery: leave it neutral.
      return 'neutral'
  }
}

/** Tone of a change for a kind: good, bad or neutral (small changes are neutral). */
export function changeTone(
  kind: string,
  delta: number,
  threshold: number,
): 'good' | 'bad' | 'neutral' {
  const p = polarity(kind)
  if (p === 'neutral' || Math.abs(delta) < threshold) return 'neutral'
  return delta > 0 === (p === 'higher') ? 'good' : 'bad'
}

/** Everything the progress charts share: the chosen range, its window and the timeline. */
export interface ProgressScope {
  range: ProgressRange
  window: TimeWindow
  cycle: Date | null
  lanes: ProtocolLane[]
  /** Where "change since" is measured from: the cycle start when it is in view. */
  since: Date
}

export function progressScope(
  range: ProgressRange,
  now: Date,
  protocols: readonly ProtocolRow[],
): ProgressScope {
  const cycle = cycleStart(protocols)
  const window = rangeWindow(range, now, cycle)
  const since = range === 'cycle' && cycle && cycle >= window.from ? cycle : window.from
  return { range, window, cycle, lanes: protocolLanes(protocols, window), since }
}

/** Chart overlays from the timeline: a guide per dose change and a shade per pause. */
export function laneMarks(
  lanes: readonly ProtocolLane[],
  colorOf: (compoundId: string) => string,
): {
  guides: { at: number; color: string }[]
  shades: { from: number; to: number; color: string }[]
} {
  return {
    guides: lanes.flatMap((l) =>
      l.changes.map((c) => ({ at: c.at.getTime(), color: colorOf(l.compoundId) })),
    ),
    shades: lanes.flatMap((l) =>
      l.segments
        .filter((s) => s.pause)
        .map((s) => ({
          from: s.start.getTime(),
          to: s.end.getTime(),
          color: colorOf(l.compoundId),
        })),
    ),
  }
}

/** Change between the first and last months that have data; null with fewer than two. */
export function monthDelta(months: readonly MonthMean[]): number | null {
  const filled = months.filter((m): m is MonthMean & { mean: number } => m.mean !== null)
  const first = filled[0]
  const last = filled[filled.length - 1]
  return first && last && first !== last ? last.mean - first.mean : null
}

/** "+2,1", "−3,4", "0": a real minus sign, no sign for zero after rounding. */
export function fmtSigned(v: number, locale: Locale, digits: number): string {
  const s = fmtNumber(Math.abs(v), locale, digits)
  if (s === fmtNumber(0, locale, digits)) return s
  return `${v > 0 ? '+' : '−'}${s}`
}
