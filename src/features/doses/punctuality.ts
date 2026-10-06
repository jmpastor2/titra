/**
 * Puntualidad: how close to their planned time the doses go in. Adherence says whether a
 * dose was taken; this says how well the rhythm holds, which matters for a nightly pulse as
 * much as for a weekly shot. One robust figure (the median distance, so one make-up dose
 * days late does not swamp a month of punctual nights) and the share within the hour that
 * counts as on time. Pure; see punctuality.test.ts.
 */
import { fmtNumber, type Locale } from '@/lib/format'
import { ON_TIME_MIN } from './delta'
import type { WeekCell } from './week'

const DAY_MS = 86_400_000
const DAY_MIN = 24 * 60

export interface Punctuality {
  /** Median distance from the planned time, in whole minutes (early and late alike). */
  medianMin: number
  /** Share of the doses within `ON_TIME_MIN` of their planned time, 0–1. */
  onTime: number
  /** Planned administrations taken in the window. */
  count: number
}

/** The middle value (the mean of the two middle ones for an even count); null when empty. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = values.toSorted((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/**
 * Over the planned administrations of the last `windowDays` that were taken: the median
 * distance from their time and how many were on time. Extras cover no planned time, so
 * they have no distance and stay out. Null when nothing planned was taken in the window.
 */
export function punctuality(
  cells: Iterable<Pick<WeekCell, 'status' | 'plannedAt' | 'takenAt' | 'deltaMin'>>,
  now: Date,
  windowDays = 28,
): Punctuality | null {
  const from = now.getTime() - windowDays * DAY_MS
  const gaps: number[] = []
  for (const c of cells) {
    if (c.status === 'extra' || c.deltaMin === null || !c.takenAt) continue
    if (c.plannedAt.getTime() <= from || c.takenAt.getTime() > now.getTime()) continue
    gaps.push(Math.abs(c.deltaMin))
  }
  const mid = median(gaps)
  if (mid === null) return null
  return {
    medianMin: Math.round(mid),
    onTime: gaps.filter((g) => g <= ON_TIME_MIN).length / gaps.length,
    count: gaps.length,
  }
}

/**
 * The median as a number and its unit, in the unit that reads best: "±12 min", "±1,5 h",
 * "±1,2 d". The sign says "either way": early and late count the same.
 */
export function fmtPunctuality(min: number, locale: Locale): { value: string; unit: string } {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return { value: `±${m}`, unit: 'min' }
  if (m < DAY_MIN) return { value: `±${fmtNumber(m / 60, locale, 1)}`, unit: 'h' }
  return { value: `±${fmtNumber(m / DAY_MIN, locale, 1)}`, unit: 'd' }
}
