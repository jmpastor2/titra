/**
 * How a cycle reads at a glance: "week 3 of 12" and the rest that is left.
 * Pure and locale-free: components turn these into words. See readout.test.ts.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type { CycleInfo, CycleStep } from '@/domain/dosing/cycle'

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

/** A countdown in the unit that reads best: weeks while there are more than seven days. */
export function remaining(days: number): { unit: 'weeks' | 'days'; count: number } {
  return days > 7
    ? { unit: 'weeks', count: Math.ceil(days / 7) }
    : { unit: 'days', count: Math.max(0, days) }
}
