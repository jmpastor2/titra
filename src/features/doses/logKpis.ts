/**
 * The figures at the top of Registro: how the week is going, how the last four weeks went,
 * how long since the last dose and what is next. All of it comes from the same matching as
 * the week card and the Today ring, so the three always agree. Pure; see logKpis.test.ts.
 */
import { addDays, startOfDay, startOfWeek } from 'date-fns'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { adherence } from '@/domain/dosing/schedule'
import { fmtHours, type Locale } from '@/lib/format'
import type { Administration } from './administrations'
import { protocolDoseRows, weekPlanVsActual, type WeekCell, type WeekDay } from './week'

/** How a day of the week reads on the strip. */
export type DayMark =
  /** Nothing planned. */
  | 'rest'
  /** Everything planned that day is taken, on time. */
  | 'done'
  /** Everything planned is taken, at least one off its time. */
  | 'late'
  /** Something planned was not taken and its time has passed. */
  | 'missed'
  /** Something planned is waiting for you now. */
  | 'due'
  /** Some taken, some still to come. */
  | 'partial'
  /** Nothing taken yet, all to come. */
  | 'upcoming'

export interface StripDay {
  day: Date
  mark: DayMark
  /** A dose nobody planned was taken that day. */
  extra: boolean
}

export interface WeekFigures {
  /** Planned administrations of the week, the ones still to come included. */
  planned: number
  taken: number
  missed: number
  /** Planned and not taken yet: due now or still to come. */
  remaining: number
  extras: number
}

export interface NextDose {
  protocol: ProtocolRow
  /** The planned time (a night one reads as the evening before: see `slotDay`). */
  at: Date
  slotDay: Date
  /** Its time has come and it is waiting. */
  due: boolean
}

export interface LogKpis {
  week: WeekFigures
  strip: StripDay[]
  /** The last four weeks of the protocols being followed; null when none has planned doses yet. */
  adherence: { taken: number; expected: number; ratio: number } | null
  /** The most recent administration that is not in the future. */
  last: Administration | null
  next: NextDose | null
}

/** How long ago, as a bare quantity: "45 min", "14 h", "3 d 4 h". */
export function fmtElapsed(from: Date, now: Date, locale: Locale): string {
  const min = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60_000))
  return min < 60 ? `${Math.max(1, min)} min` : fmtHours(min / 60, locale)
}

const planned = (cells: readonly WeekCell[]) => cells.filter((c) => c.status !== 'extra')

/** One day of the strip from the cells that fall on it. */
export function dayMark(cells: readonly WeekCell[]): DayMark {
  const plan = planned(cells)
  if (plan.length === 0) return 'rest'
  if (plan.some((c) => c.status === 'missed')) return 'missed'
  if (plan.some((c) => c.status === 'due')) return 'due'
  const taken = plan.filter((c) => c.takenAt).length
  if (taken === 0) return 'upcoming'
  if (taken < plan.length) return 'partial'
  return plan.some((c) => c.status === 'late' || c.status === 'early') ? 'late' : 'done'
}

export function weekFigures(days: readonly WeekDay[]): WeekFigures {
  const cells = days.flatMap((d) => d.cells)
  const plan = planned(cells)
  const taken = plan.filter((c) => c.takenAt).length
  return {
    planned: plan.length,
    taken,
    missed: plan.filter((c) => c.status === 'missed').length,
    remaining: plan.filter((c) => c.status === 'due' || c.status === 'upcoming').length,
    extras: cells.length - plan.length,
  }
}

/**
 * The next administration still to take: the earliest planned one that is waiting or yet to
 * come, looking at this week and the next so Sunday evening still sees Monday.
 */
export function nextDose(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
): NextDose | null {
  const monday = startOfWeek(now, { weekStartsOn: 1 })
  const waiting = [0, 1]
    .flatMap((w) => weekPlanVsActual(protocols, doses, addDays(monday, w * 7), now))
    .flatMap((d) => d.cells)
    .filter((c) => c.status === 'due' || c.status === 'upcoming')
    .toSorted((a, b) => a.plannedAt.getTime() - b.plannedAt.getTime())
  const first = waiting[0]
  return first
    ? {
        protocol: first.protocol,
        at: first.plannedAt,
        slotDay: first.slotDay ?? startOfDay(first.plannedAt),
        due: first.status === 'due',
      }
    : null
}

/** Adherence of the protocols being followed over the trailing four weeks, as one figure. */
export function overallAdherence(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
): LogKpis['adherence'] {
  let taken = 0
  let expected = 0
  for (const p of protocols) {
    const a = adherence(toProtocolLike(p), protocolDoseRows(p, doses).map(toDoseEvent), now)
    taken += a.taken
    expected += a.expected
  }
  return expected > 0 ? { taken, expected, ratio: Math.min(1, taken / expected) } : null
}

/**
 * Everything the header needs. `administrations` are the log's, most recent first.
 * Only protocols being followed count: a paused or finished plan expects nothing.
 */
export function logKpis(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  administrations: readonly Administration[],
  now: Date,
): LogKpis {
  const following = protocols.filter((p) => p.status === 'active')
  const days = weekPlanVsActual(following, doses, startOfWeek(now, { weekStartsOn: 1 }), now)
  return {
    week: weekFigures(days),
    strip: days.map((d) => ({
      day: d.day,
      mark: dayMark(d.cells),
      extra: d.cells.some((c) => c.status === 'extra'),
    })),
    adherence: overallAdherence(following, doses, now),
    last: administrations.find((a) => a.at <= now) ?? null,
    next: nextDose(following, doses, now),
  }
}
