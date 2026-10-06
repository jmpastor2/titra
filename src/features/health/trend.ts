/**
 * Body trend maths: one reading per day, a time-aware exponential moving average over
 * irregular weigh-ins, the weekly rate from a least-squares fit and the change since a
 * baseline. Pure; callers pass `now` where it matters.
 */
import { addDays, startOfDay } from 'date-fns'
import { sortPoints, type TimePoint } from './progress'

const DAY_MS = 86_400_000

/**
 * Time constant of a 7-day EMA: a daily series smoothed with alpha = 2 / (7 + 1) decays
 * by (1 − alpha) per day, i.e. exp(−1 / tau) with tau ≈ 3.5 days. Expressing it as a time
 * constant keeps the smoothing honest when weigh-ins skip days.
 */
export const EMA_TAU_DAYS = -1 / Math.log(1 - 2 / (7 + 1))

/** Mean per local day, placed at the day's last reading, oldest first. */
export function dailyMeans(points: readonly TimePoint[]): TimePoint[] {
  const byDay = new Map<number, { sum: number; n: number; at: Date }>()
  for (const p of points) {
    const key = startOfDay(p.at).getTime()
    const cur = byDay.get(key)
    if (cur) {
      cur.sum += p.value
      cur.n += 1
      if (p.at > cur.at) cur.at = p.at
    } else byDay.set(key, { sum: p.value, n: 1, at: p.at })
  }
  return sortPoints([...byDay.values()].map((d) => ({ at: d.at, value: d.sum / d.n })))
}

/**
 * Exponential moving average over daily means. Each new day pulls the level towards its
 * value by 1 − exp(−Δt / tau), so a reading after a long gap counts for more.
 */
export function ema(points: readonly TimePoint[], tauDays = EMA_TAU_DAYS): TimePoint[] {
  const days = dailyMeans(points)
  let level = 0
  let prev: Date | null = null
  return days.map((p) => {
    if (prev === null) level = p.value
    else {
      const dt = Math.max(0, (p.at.getTime() - prev.getTime()) / DAY_MS)
      level += (1 - Math.exp(-dt / tauDays)) * (p.value - level)
    }
    prev = p.at
    return { at: p.at, value: level }
  })
}

export interface WeeklyRate {
  /** Change per week from a least-squares line (negative = losing). */
  perWeek: number
  /** Days with a reading used in the fit. */
  n: number
  spanDays: number
}

/** Readings needed before a weekly rate means anything. */
export const RATE_MIN_POINTS = 3
export const RATE_MIN_SPAN_DAYS = 7

/**
 * Weekly rate over the last `windowDays` before the latest reading: the slope of a
 * least-squares line through daily means. Null with fewer than 3 days of readings or
 * when they span less than a week, where noise would dominate.
 */
export function weeklyRate(points: readonly TimePoint[], windowDays = 28): WeeklyRate | null {
  const days = dailyMeans(points)
  const last = days[days.length - 1]
  if (!last) return null
  const cutoff = last.at.getTime() - windowDays * DAY_MS
  const pts = days.filter((p) => p.at.getTime() >= cutoff)
  const first = pts[0]
  if (!first || pts.length < RATE_MIN_POINTS) return null
  const spanDays = (last.at.getTime() - first.at.getTime()) / DAY_MS
  if (spanDays < RATE_MIN_SPAN_DAYS) return null
  const xs = pts.map((p) => (p.at.getTime() - first.at.getTime()) / DAY_MS)
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length
  const my = pts.reduce((s, p) => s + p.value, 0) / pts.length
  let num = 0
  let den = 0
  pts.forEach((p, i) => {
    const dx = xs[i]! - mx
    num += dx * (p.value - my)
    den += dx * dx
  })
  if (!(den > 0)) return null
  return { perWeek: (num / den) * 7, n: pts.length, spanDays }
}

export interface BaselineChange {
  latest: TimePoint
  /** First reading from shortly before `since`; null when it is the latest one. */
  baseline: TimePoint | null
  delta: number | null
  /** delta / baseline, as a fraction. */
  pct: number | null
}

/** How far before the start of a cycle a reading still counts as its baseline. */
export const BASELINE_LOOKBACK_DAYS = 14

/**
 * Latest reading against the first one on or after `since − lookback`: a weigh-in the
 * week before starting is the natural "before" picture. Readings on the same day as
 * the latest do not count as a baseline.
 */
export function baselineChange(
  points: readonly TimePoint[],
  since: Date,
  lookbackDays = BASELINE_LOOKBACK_DAYS,
): BaselineChange | null {
  const pts = sortPoints(points)
  const latest = pts[pts.length - 1]
  if (!latest) return null
  const from = addDays(startOfDay(since), -lookbackDays)
  const first = pts.find((p) => p.at >= from)
  const sameDay = !first || startOfDay(first.at).getTime() === startOfDay(latest.at).getTime()
  if (sameDay) return { latest, baseline: null, delta: null, pct: null }
  const delta = latest.value - first.value
  return { latest, baseline: first, delta, pct: first.value !== 0 ? delta / first.value : null }
}

export interface GoalProgress {
  /** How much of the way from the starting value to the goal is done, 0 to 1. */
  fraction: number
  /** What is left, always positive; 0 once the goal is reached or passed. */
  remaining: number
}

/**
 * Progress towards a goal from where the person started, in either direction (losing weight or
 * gaining it). Null when the goal is where they started, or when any value is not a number.
 */
export function goalProgress(start: number, latest: number, goal: number): GoalProgress | null {
  if (![start, latest, goal].every(Number.isFinite) || start === goal) return null
  const towards = (goal - start) / Math.abs(goal - start)
  const done = ((latest - start) * towards) / Math.abs(goal - start)
  return {
    fraction: Math.min(1, Math.max(0, done)),
    remaining: Math.max(0, (goal - latest) * towards),
  }
}

/** Mean of the readings in (to − days, to], or null when there are none. */
export function meanIn(points: readonly TimePoint[], to: Date, days: number): number | null {
  const from = to.getTime() - days * DAY_MS
  const pts = points.filter((p) => p.at.getTime() > from && p.at.getTime() <= to.getTime())
  return pts.length ? pts.reduce((s, p) => s + p.value, 0) / pts.length : null
}
