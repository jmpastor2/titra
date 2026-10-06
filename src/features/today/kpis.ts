/**
 * The numbers behind the chips of Hoy: the streak of days with every dose taken, the adherence
 * of the last seven days, the cycle's week, the days the vials last. Pure; see kpis.test.ts.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { WeekDay } from '@/features/doses/week'
import type { ProtocolCycle } from '@/features/cycle/items'
import { headline } from '@/features/cycle/view'
import type { RestockLine } from '@/features/inventory/vials'

/** How a day went: nothing planned, everything taken, still to come, or something missed. */
export type DayVerdict = 'rest' | 'done' | 'open' | 'broken'

/** An extra dose is nobody's plan: it neither completes a day nor breaks one. */
export function dayVerdict(day: WeekDay): DayVerdict {
  const planned = day.cells.filter((c) => c.status !== 'extra')
  if (planned.length === 0) return 'rest'
  if (planned.some((c) => c.status === 'missed')) return 'broken'
  if (planned.some((c) => c.status === 'due' || c.status === 'upcoming')) return 'open'
  return 'done'
}

/**
 * Days in a row with every planned dose taken, counted back from today. A day off neither
 * adds nor breaks, and neither does a day that is not over yet; the first missed dose ends
 * the count. `days` run oldest to newest.
 */
export function streakOf(days: readonly WeekDay[]): number {
  let streak = 0
  for (const day of days.toReversed()) {
    const verdict = dayVerdict(day)
    if (verdict === 'broken') break
    if (verdict === 'done') streak++
  }
  return streak
}

/** Taken over planned, 0..1; null when nothing was planned. */
export function adherenceOf(summary: { planned: number; taken: number }): number | null {
  return summary.planned > 0 ? Math.min(1, summary.taken / summary.planned) : null
}

/** How the adherence reads: on track, slipping, or worth a look. Logging only, never medical. */
export function adherenceTone(fraction: number): 'ok' | 'warn' | 'danger' {
  return fraction >= 0.8 ? 'ok' : fraction >= 0.6 ? 'warn' : 'danger'
}

/** The seven-day windows that end today, newest first: week 0 is today and the six days before. */
export function windowStarts(now: Date, weeks: number): Date[] {
  const last = startOfDay(now)
  return Array.from({ length: weeks }, (_, i) => addDays(last, -6 - 7 * i))
}

export interface CycleKpi {
  /** The protocol's name. */
  name: string
  week: number
  /** Weeks of the plan; null when it has no end. */
  total: number | null
  /** The protocol is in a week of rest. */
  rest: boolean
}

/**
 * The cycle the chip speaks about: the plan with an end (a 12-week blend) before an open
 * titration, the oldest first. Nothing before it starts or once it is over.
 */
export function cycleKpi(cycles: readonly ProtocolCycle[]): CycleKpi | null {
  const found = cycles.flatMap(({ protocol, info }) => {
    const head = headline(info)
    if (head.kind === 'week') {
      return [
        {
          finite: true,
          kpi: { name: protocol.name, week: head.week, total: head.total, rest: false },
        },
      ]
    }
    if (head.kind === 'rest') {
      return [
        {
          finite: head.total !== null,
          kpi: { name: protocol.name, week: head.week, total: head.total, rest: true },
        },
      ]
    }
    if (head.kind === 'step' || head.kind === 'maintenance') {
      return [
        { finite: false, kpi: { name: protocol.name, week: head.week, total: null, rest: false } },
      ]
    }
    return []
  })
  return (found.find((f) => f.finite) ?? found[0])?.kpi ?? null
}

/** `useStock` looks this far ahead: a supply that outlasts it reads as "more than". */
export const COVER_HORIZON_DAYS = 240

export interface CoverKpi {
  /** Days until the first supply runs out; null when everything lasts past the horizon. */
  days: number | null
  /** The compounds that run out first. */
  compoundIds: string[]
}

/** The days of cover of the supply that ends first, over every compound in use. */
export function coverKpi(lines: readonly RestockLine[], now: Date): CoverKpi | null {
  const today = startOfDay(now)
  const ends = lines.flatMap((l) =>
    l.runway.runsOutAt
      ? [{ days: Math.max(0, differenceInCalendarDays(l.runway.runsOutAt, today)), line: l }]
      : [],
  )
  if (lines.length === 0) return null
  const first = ends.toSorted((a, b) => a.days - b.days)[0]
  return first
    ? { days: first.days, compoundIds: first.line.partners }
    : { days: null, compoundIds: [] }
}

/** Days of cover as a figure and its unit: "12 d", "4 meses". */
export function coverLabel(days: number | null): {
  value: number
  unit: 'd' | 'mo'
  plus: boolean
} {
  if (days === null) return { value: Math.floor(COVER_HORIZON_DAYS / 30), unit: 'mo', plus: true }
  return days < 100
    ? { value: days, unit: 'd', plus: false }
    : { value: Math.floor(days / 30), unit: 'mo', plus: false }
}

/** Days of cover that ask for a reorder: two weeks is urgent, a month is worth a look. */
export function coverTone(days: number | null): 'ok' | 'warn' | 'danger' {
  return days === null ? 'ok' : days <= 14 ? 'danger' : days <= 30 ? 'warn' : 'ok'
}

/** The days of cover as a 0..1 gauge: full at three months. */
export function coverFraction(days: number | null): number {
  return days === null ? 1 : Math.max(0.04, Math.min(1, days / 90))
}
