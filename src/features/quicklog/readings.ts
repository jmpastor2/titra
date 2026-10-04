/**
 * What the Registro rápido tiles say, derived from measurement rows: the latest reading of
 * a kind and the one before it, the entries of a day and their total, the strength sessions
 * of the week and the check-in streak. Pure; callers pass `now`. See readings.test.ts.
 */
import { differenceInCalendarDays, isSameDay, startOfDay } from 'date-fns'
import type { MeasurementKind, MeasurementRow } from '@/data/database.types'
import { WELLBEING } from '@/features/checkin/wellbeing'
import { daySet, dayStrip, daysSinceLast, streak } from '@/features/health/consistency'

export interface Reading {
  value: number
  at: Date
}

export interface LatestReading extends Reading {
  /** The reading before this one, for "−0,5 kg". */
  previous: Reading | null
}

const time = (r: MeasurementRow) => Date.parse(r.measured_at)

/** Rows of one kind, newest first. */
export function ofKind(rows: readonly MeasurementRow[], kind: MeasurementKind): MeasurementRow[] {
  return rows.filter((r) => r.kind === kind).toSorted((a, b) => time(b) - time(a))
}

function toReading(r: MeasurementRow): Reading {
  return { value: Number(r.value), at: new Date(r.measured_at) }
}

export function latestReading(
  rows: readonly MeasurementRow[],
  kind: MeasurementKind,
): LatestReading | null {
  const [last, before] = ofKind(rows, kind)
  return last ? { ...toReading(last), previous: before ? toReading(before) : null } : null
}

/** The last `count` values of a kind, oldest first: the line of a sparkline. */
export function recentValues(
  rows: readonly MeasurementRow[],
  kind: MeasurementKind,
  count: number,
): number[] {
  return ofKind(rows, kind)
    .slice(0, count)
    .map((r) => Number(r.value))
    .toReversed()
}

/** Calendar days since `at`: 0 today, 1 yesterday. */
export function daysAgo(at: Date, now: Date): number {
  return Math.max(0, differenceInCalendarDays(now, at))
}

/** Rows of one kind logged on a local calendar day, newest first. */
export function entriesOn(
  rows: readonly MeasurementRow[],
  kind: MeasurementKind,
  day: Date,
): MeasurementRow[] {
  return ofKind(rows, kind).filter((r) => isSameDay(new Date(r.measured_at), day))
}

/** Sum of a day's entries: ml of water, g of protein. */
export function dayTotal(rows: readonly MeasurementRow[], kind: MeasurementKind, day: Date) {
  return entriesOn(rows, kind, day).reduce((sum, r) => sum + Number(r.value), 0)
}

export interface StrengthWeek {
  /** Sessions in the last 7 days (a rolling week, as in Progress). */
  count: number
  /** The latest session; minutes is null when it was logged without a duration. */
  last: { at: Date; minutes: number | null } | null
  /** Whether each of the last 7 days has a session, oldest first. */
  days: boolean[]
}

export function strengthWeek(rows: readonly MeasurementRow[], now: Date): StrengthWeek {
  const sessions = ofKind(rows, 'resistance_session').filter((r) => time(r) <= now.getTime())
  const from = now.getTime() - 7 * 86_400_000
  const [latest] = sessions
  return {
    count: sessions.filter((r) => time(r) > from).length,
    last: latest
      ? {
          at: new Date(latest.measured_at),
          minutes: latest.unit === 'min' ? Number(latest.value) : null,
        }
      : null,
    days: dayStrip(daySet(sessions.map((r) => new Date(r.measured_at))), now, 7),
  }
}

export interface CheckInSummary {
  doneToday: boolean
  /** Consecutive days with a check-in, still alive until today is over. */
  streak: number
  /** Days since the last check-in, null when there is none. */
  ageDays: number | null
  /** The last 7 days, oldest first. */
  strip: boolean[]
  /** The latest score of each dimension, for "igual que la última vez". */
  last: Partial<Record<MeasurementKind, number>>
  lastAt: Date | null
}

export function checkInSummary(rows: readonly MeasurementRow[], now: Date): CheckInSummary {
  const scored = rows
    .filter((r) => WELLBEING.includes(r.kind) && time(r) <= now.getTime())
    .toSorted((a, b) => time(b) - time(a))
  const days = daySet(scored.map((r) => new Date(r.measured_at)))
  const last: Partial<Record<MeasurementKind, number>> = {}
  for (const r of scored) last[r.kind] ??= Number(r.value)
  const [latest] = scored
  return {
    doneToday: days.has(startOfDay(now).getTime()),
    streak: streak(days, now),
    ageDays: daysSinceLast(days, now),
    strip: dayStrip(days, now, 7),
    last,
    lastAt: latest ? new Date(latest.measured_at) : null,
  }
}
