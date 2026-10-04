/**
 * How a cycle reads at a glance: "week 3 of 12", how much of the dosing is behind us,
 * the rest that is left, and the one-line summaries of the cycles in progress.
 * Pure and locale-free: components turn these into words. See readout.test.ts.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type { CycleChange, CycleInfo, CycleStep } from '@/domain/dosing/cycle'
import { cycleCompoundIds, type CycleView } from './model'

export type WeekReadout =
  | { kind: 'before'; days: number }
  /** `of` is the dosing weeks of the plan, or the titration weeks when it ends open. */
  | { kind: 'dosing'; week: number; of: number | null }
  /** `daysLeft` is null for a rest without an end date. */
  | { kind: 'rest'; daysLeft: number | null }
  | { kind: 'maintenance'; week: number }
  | { kind: 'finished' }

/** Weeks of the finite dosing steps: what a titration that ends in maintenance counts to. */
export function titrationWeeks(info: Pick<CycleInfo, 'steps'>): number | null {
  const weeks = info.steps
    .filter((s) => !s.pause && s.weeks !== null)
    .reduce((sum, s) => sum + (s.weeks ?? 0), 0)
  return weeks > 0 ? weeks : null
}

export interface StepWeeks {
  /** First and last dosing week of the cycle the step covers. */
  from: number | null
  /** Null for a rest, and for an open-ended step. */
  to: number | null
}

/**
 * The dosing weeks each step covers, counted as "week 3 of 12" counts them: rest weeks
 * take no number. A rest has none; an open-ended step has no last week.
 */
export function stepWeeks(steps: readonly Pick<CycleStep, 'pause' | 'weeks'>[]): StepWeeks[] {
  let before = 0
  return steps.map((s) => {
    if (s.pause) return { from: null, to: null }
    const from = before + 1
    before += s.weeks ?? 0
    return { from, to: s.weeks === null ? null : before }
  })
}

export function weekReadout(info: CycleInfo, now: Date): WeekReadout {
  const today = startOfDay(now)
  switch (info.phase) {
    case 'before':
      return { kind: 'before', days: differenceInCalendarDays(info.startsOn, today) }
    case 'finished':
      return { kind: 'finished' }
    case 'rest':
      return {
        kind: 'rest',
        daysLeft: info.step?.endsOn ? differenceInCalendarDays(info.step.endsOn, today) : null,
      }
    case 'maintenance':
      return { kind: 'maintenance', week: info.doseWeek ?? info.week }
    case 'dosing':
      return {
        kind: 'dosing',
        week: info.doseWeek ?? info.week,
        of: info.doseWeeks ?? titrationWeeks(info),
      }
  }
}

/**
 * Share of the dosing weeks already behind us, 0–1. Rest weeks do not count either way,
 * so "12 of 12" is a full ring whatever rest follows. A plan that ends in maintenance
 * counts its titration: the ring fills as the doses step up and stays full afterwards.
 */
export function doseProgress(info: Pick<CycleInfo, 'steps'>, now: Date): number {
  const today = startOfDay(now)
  let done = 0
  let total = 0
  for (const s of info.steps) {
    if (s.pause || s.endsOn === null) continue
    const days = differenceInCalendarDays(s.endsOn, s.startsOn)
    total += days
    done += Math.min(days, Math.max(0, differenceInCalendarDays(today, s.startsOn)))
  }
  return total > 0 ? done / total : 1
}

/** A countdown in the unit that reads best: weeks while there are more than seven days. */
export function remaining(days: number): { unit: 'weeks' | 'days'; count: number } {
  return days > 7
    ? { unit: 'weeks', count: Math.ceil(days / 7) }
    : { unit: 'days', count: Math.max(0, days) }
}

export interface SummaryLine {
  id: string
  name: string
  compoundIds: string[]
  readout: WeekReadout
  next: CycleChange | null
}

/** One line per active protocol, in the order of the Ciclos screen. */
export function summaryLines(views: readonly CycleView[], now: Date): SummaryLine[] {
  return views
    .filter((v) => v.row.status === 'active')
    .map((v) => ({
      id: v.row.id,
      name: v.row.name,
      compoundIds: cycleCompoundIds(v),
      readout: weekReadout(v.info, now),
      next: v.info.next,
    }))
}
