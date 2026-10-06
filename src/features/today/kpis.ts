/**
 * The numbers behind the four tiles of Hoy: the streak of days with every dose taken, the
 * adherence of the last 28 days against the 28 before, the cycle's week and its staircase, and
 * the days the supply lasts with the day to order by. Pure; see kpis.test.ts.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { Step } from '@/components/kpi/Steps'
import type { TickState } from '@/components/kpi/Ticks'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import type { CycleInfo } from '@/domain/dosing/cycle'
import { adherence } from '@/domain/dosing/schedule'
import type { WeekDay } from '@/features/doses/week'
import { protocolDoses, type ProtocolCycle } from '@/features/cycle/items'
import { headline, weekTrack, type Headline } from '@/features/cycle/view'
import { REORDER_DAYS } from '@/features/inventory/alerts'
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

/**
 * One bar per day for the streak tile: complete days solid, a miss rose, a day in progress
 * half-tone once something is taken, days with nothing planned a faint stub.
 */
export function streakTicks(days: readonly WeekDay[]): TickState[] {
  return days.map((day) => {
    switch (dayVerdict(day)) {
      case 'done':
        return 'full'
      case 'broken':
        return 'missed'
      case 'open':
        return day.cells.some((c) => c.status !== 'extra' && c.takenAt) ? 'partial' : 'none'
      case 'rest':
        return 'none'
    }
  })
}

/** The seven-day windows that end today, newest first: week 0 is today and the six days before. */
export function windowStarts(now: Date, weeks: number): Date[] {
  const last = startOfDay(now)
  return Array.from({ length: weeks }, (_, i) => addDays(last, -6 - 7 * i))
}

/* ------------------------------------------------------------------ adherence */

export interface AdherenceFigure {
  taken: number
  expected: number
  /** taken / expected, 0..1. */
  ratio: number
}

/** Adherence windows shorter than this many expected doses are too thin to compare. */
export const MIN_COMPARABLE = 4

/**
 * Taken over expected across the protocols being followed, over the 28 days that end at `at`
 * (the engine's own window: a dose still inside its grace time is not counted against you).
 * The same figure as Registro's. Null when nothing was expected.
 */
export function adherenceAt(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  at: Date,
): AdherenceFigure | null {
  let taken = 0
  let expected = 0
  for (const p of protocols) {
    if (p.status !== 'active') continue
    const a = adherence(toProtocolLike(p), protocolDoses(p, doses).map(toDoseEvent), at)
    taken += a.taken
    expected += a.expected
  }
  return expected > 0 ? { taken, expected, ratio: Math.min(1, taken / expected) } : null
}

export interface AdherenceKpi extends AdherenceFigure {
  /** Change against the 28 days before, in whole percentage points as shown; null when not comparable. */
  deltaPts: number | null
}

/** A figure as the whole percentage the tile shows. */
const pct = (f: AdherenceFigure) => Math.round(f.ratio * 100)

/** The last 28 days, and how they compare with the 28 before. */
export function adherenceKpi(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
): AdherenceKpi | null {
  const current = adherenceAt(protocols, doses, now)
  if (!current) return null
  const before = adherenceAt(protocols, doses, addDays(now, -28))
  return {
    ...current,
    deltaPts: before && before.expected >= MIN_COMPARABLE ? pct(current) - pct(before) : null,
  }
}

/** How the adherence reads: on track, slipping, or worth a look. Logging only, never medical. */
export function adherenceTone(fraction: number): 'ok' | 'warn' | 'danger' {
  return fraction >= 0.8 ? 'ok' : fraction >= 0.6 ? 'warn' : 'danger'
}

/** The objective drawn on the adherence gauge. */
export const ADHERENCE_TARGET = 0.9

/* ------------------------------------------------------------------ cycle */

export interface CycleKpi extends ProtocolCycle {
  head: Extract<Headline, { kind: 'week' | 'step' | 'rest' | 'maintenance' }>
}

/**
 * The cycle the tile speaks about: the plan with an end (a 12-week blend) before an open
 * titration, the oldest first. Nothing before it starts or once it is over.
 */
export function cycleKpi(cycles: readonly ProtocolCycle[]): CycleKpi | null {
  const found = cycles.flatMap((c) => {
    const head = headline(c.info)
    if (head.kind === 'before' || head.kind === 'finished') return []
    const finite = head.kind === 'week' || (head.kind === 'rest' && head.total !== null)
    return [{ finite, kpi: { ...c, head } }]
  })
  return (found.find((f) => f.finite) ?? found[0])?.kpi ?? null
}

/** Bars a phone-wide tile shows comfortably; a longer plan is cut around the current week. */
export const STEPS_MAX = 20

/**
 * The plan as a staircase: one bar per week, as high as that week's dose against the plan's
 * highest, done / current / planned, rest weeks hatched. An open-ended step is one bar.
 */
export function cycleSteps(info: CycleInfo, max = STEPS_MAX): Step[] {
  const top = Math.max(0, ...info.steps.map((s) => s.doseMg))
  const level = (index: number) => {
    const dose = info.steps[index]?.doseMg ?? 0
    return top > 0 ? dose / top : 1
  }
  return weekTrack(info, max).map((cell): Step => {
    const kind = cell.state === 'current' ? 'current' : cell.state === 'done' ? 'done' : 'planned'
    if (cell.kind === 'more') return { kind, level: 0.18 }
    if (cell.kind === 'week' && cell.rest) return { kind: 'rest', level: 1 }
    return { kind, level: level(cell.step) }
  })
}

/* ------------------------------------------------------------------ supply */

/** `useStock` looks this far ahead: a supply that outlasts it reads as "more than". */
export const COVER_HORIZON_DAYS = 240

/** The supply gauge is full at three months. */
export const COVER_GAUGE_DAYS = 90

export interface CoverKpi {
  /** Days until the first supply runs out; null when everything lasts past the horizon. */
  days: number | null
  /** The compounds that run out first. */
  compoundIds: string[]
  /** The day it runs out. */
  runsOutAt: Date | null
  /** The day to order by: the run-out day less the usual delivery margin (Inventario's rule). */
  orderBy: Date | null
}

/** The days of cover of the supply that ends first, over every compound in use. */
export function coverKpi(lines: readonly RestockLine[], now: Date): CoverKpi | null {
  if (lines.length === 0) return null
  const today = startOfDay(now)
  const first = lines
    .flatMap((l) => (l.runway.runsOutAt ? [{ at: l.runway.runsOutAt, line: l }] : []))
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())[0]
  if (!first) return { days: null, compoundIds: [], runsOutAt: null, orderBy: null }
  return {
    days: Math.max(0, differenceInCalendarDays(first.at, today)),
    compoundIds: first.line.partners,
    runsOutAt: first.at,
    orderBy: addDays(first.at, -REORDER_DAYS),
  }
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

/** Whether the order-by day has come (or passed): then the tile says "order now". */
export function orderNow(cover: CoverKpi, now: Date): boolean {
  return cover.orderBy !== null && differenceInCalendarDays(cover.orderBy, startOfDay(now)) <= 0
}
