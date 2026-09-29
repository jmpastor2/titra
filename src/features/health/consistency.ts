/**
 * Logging consistency: which days have a record, streaks, "last one X days ago", and
 * dose adherence across every active protocol, in total and day by day. Pure; callers
 * pass `now`.
 */
import { addDays, addHours, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { adherence } from '@/domain/dosing/schedule'
import type { DoseEvent } from '@/domain/types'

const DAY_MS = 86_400_000

/** A check-in older than this many days gets a nudge. */
export const CHECKIN_STALE_DAYS = 3

/* ------------------------------------------------------------ days with a record */

/** Local midnights (epoch ms) of the days that have at least one record. */
export function daySet(dates: Iterable<Date>): Set<number> {
  const out = new Set<number>()
  for (const d of dates) out.add(startOfDay(d).getTime())
  return out
}

/**
 * Consecutive days with a record ending today, or ending yesterday when today has none
 * yet: the streak is still alive until the day is over.
 */
export function streak(days: ReadonlySet<number>, now: Date): number {
  let day = startOfDay(now)
  if (!days.has(day.getTime())) day = addDays(day, -1)
  let n = 0
  while (days.has(day.getTime())) {
    n += 1
    day = addDays(day, -1)
  }
  return n
}

/** Calendar days since the latest record (0 = today), or null with none. */
export function daysSinceLast(days: ReadonlySet<number>, now: Date): number | null {
  let latest: number | null = null
  for (const d of days) if (d <= now.getTime() && (latest === null || d > latest)) latest = d
  return latest === null ? null : differenceInCalendarDays(now, new Date(latest))
}

/** Whether each of the last `n` days (oldest first, ending today) has a record. */
export function dayStrip(days: ReadonlySet<number>, now: Date, n: number): boolean[] {
  const today = startOfDay(now)
  return Array.from({ length: n }, (_, i) => days.has(addDays(today, i - n + 1).getTime()))
}

/** Days with a record among the last `n` days, today included. */
export function daysWithRecord(days: ReadonlySet<number>, now: Date, n: number): number {
  return dayStrip(days, now, n).filter(Boolean).length
}

/* ------------------------------------------------------------ dose adherence */

export type DayMark = 'none' | 'full' | 'partial' | 'missed'

export interface DayCell {
  day: Date
  mark: DayMark
}

/** A `dayStrip` ending today as dated strip cells. */
export function presenceMarks(strip: readonly boolean[], now: Date): DayCell[] {
  const today = startOfDay(now)
  return strip.map((has, i) => ({
    day: addDays(today, i - strip.length + 1),
    mark: has ? 'full' : 'none',
  }))
}

/**
 * Active protocols counted once per primary compound: a blend or stack is one
 * administration however many rows it writes, and a duplicated protocol for the same
 * compound would otherwise double the expected doses. The earliest one wins.
 */
export function activeByCompound(protocols: readonly ProtocolRow[]): ProtocolRow[] {
  const seen = new Set<string>()
  return protocols
    .filter((p) => p.status === 'active')
    .toSorted((a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id))
    .filter((p) => {
      if (seen.has(p.compound_id)) return false
      seen.add(p.compound_id)
      return true
    })
}

/** A protocol's own administrations: its primary compound, tagged to it or untagged. */
export function protocolHistory(row: ProtocolRow, doses: readonly DoseRow[]): DoseEvent[] {
  return doses
    .filter(
      (d) => d.compound_id === row.compound_id && (!d.protocol_id || d.protocol_id === row.id),
    )
    .map(toDoseEvent)
}

export interface AdherenceTotal {
  taken: number
  expected: number
  /** taken / expected, or null when nothing was due. */
  ratio: number | null
}

interface Prepared {
  like: ReturnType<typeof toProtocolLike>
  history: DoseEvent[]
}

function prepare(protocols: readonly ProtocolRow[], doses: readonly DoseRow[]): Prepared[] {
  return activeByCompound(protocols)
    .map((row) => ({ like: toProtocolLike(row), history: protocolHistory(row, doses) }))
    .filter((p) => p.like.steps.length > 0)
}

function total(prepared: readonly Prepared[], now: Date, windowDays: number): AdherenceTotal {
  let taken = 0
  let expected = 0
  for (const p of prepared) {
    const a = adherence(p.like, p.history, now, windowDays)
    taken += a.taken
    expected += a.expected
  }
  return { taken, expected, ratio: expected > 0 ? Math.min(1, taken / expected) : null }
}

/** Adherence over the trailing window summed across active protocols. */
export function adherenceTotal(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
  windowDays: number,
): AdherenceTotal {
  return total(prepare(protocols, doses), now, windowDays)
}

export interface AdherenceDay extends AdherenceTotal, DayCell {}

/**
 * A dosing day runs 06:00 to 06:00, so a night shot after midnight ("24:30") and the
 * lateness allowed to a 23:00 shot both land on the evening they belong to.
 */
export const DAY_ROLLOVER_H = 6

/**
 * Adherence for each of the last `n` days, oldest first. Doses still inside their grace
 * window only count once taken, so today never reads as missed before it is over.
 */
export function adherenceDays(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
  n: number,
): AdherenceDay[] {
  const prepared = prepare(protocols, doses)
  const today = startOfDay(now)
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(today, i - n + 1)
    const from = addHours(day, DAY_ROLLOVER_H)
    const endRaw = addHours(addDays(day, 1), DAY_ROLLOVER_H)
    const end = endRaw < now ? endRaw : now
    const span = (end.getTime() - from.getTime()) / DAY_MS
    const t: AdherenceTotal =
      span > 0 ? total(prepared, end, span) : { taken: 0, expected: 0, ratio: null }
    const mark: DayMark =
      t.expected === 0
        ? 'none'
        : t.taken >= t.expected
          ? 'full'
          : t.taken === 0
            ? 'missed'
            : 'partial'
    return { day, ...t, mark }
  })
}
