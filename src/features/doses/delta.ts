/**
 * How a dose sits against the planned administration it covers, in words people use:
 * "+2 h 02", "−40 min", "+5 d 7 h". Pure; see delta.test.ts.
 */
import type { WeekCell } from './week'

/** Within this of the planned time counts as on time. */
export const ON_TIME_MIN = 60
/** A gap of a day or more reads as days, and a late one is a make-up of a missed administration. */
export const DAY_MIN = 24 * 60

/** "+2 h 02" / "−40 min" / "+5 d 7 h": big gaps read as days, never as "+127 h 00". */
export function fmtDeltaMin(min: number): string {
  const sign = min < 0 ? '−' : '+'
  const m = Math.round(Math.abs(min))
  if (m < 60) return `${sign}${m} min`
  if (m < DAY_MIN) {
    const rest = m % 60
    return `${sign}${Math.floor(m / 60)} h${rest ? ` ${String(rest).padStart(2, '0')}` : ''}`
  }
  // Whole hours are enough once it is days; round first so 23 h 40 min never reads "0 d 24 h".
  const hours = Math.round(m / 60)
  const rest = hours % 24
  return `${sign}${Math.floor(hours / 24)} d${rest ? ` ${rest} h` : ''}`
}

/** Whole days of a gap, at least 1: "retrasada 5 d". */
export function wholeDays(min: number): number {
  return Math.max(1, Math.round(Math.abs(min) / DAY_MIN))
}

export type FitKind =
  /** Within an hour of its planned time. */
  | 'onTime'
  /** Later than an hour, less than a day. */
  | 'late'
  /** Earlier than an hour, less than a day. */
  | 'early'
  /** A day or more after its planned time: a make-up of a missed administration. */
  | 'makeUp'
  /** A day or more before its planned time. */
  | 'ahead'
  /** Covers no planned administration. */
  | 'extra'

export type Fit =
  /** Covers no planned administration. */
  { kind: 'extra'; deltaMin: null } | { kind: Exclude<FitKind, 'extra'>; deltaMin: number }

/** Where a taken dose stands against the plan, from the week card's cell. */
export function fitOf(cell: Pick<WeekCell, 'status' | 'deltaMin'>): Fit {
  const delta = cell.deltaMin
  if (cell.status === 'extra' || delta === null) return { kind: 'extra', deltaMin: null }
  const abs = Math.abs(delta)
  if (abs <= ON_TIME_MIN) return { kind: 'onTime', deltaMin: delta }
  if (abs < DAY_MIN) return { kind: delta > 0 ? 'late' : 'early', deltaMin: delta }
  return { kind: delta > 0 ? 'makeUp' : 'ahead', deltaMin: delta }
}
