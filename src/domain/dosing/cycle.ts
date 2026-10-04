/**
 * Where a protocol stands in its cycle: which week of how many, the dose now, when the
 * dose changes next and whether the plan ends in a rest. Weeks count in 7-day blocks from
 * the start date (a protocol started on a Monday has Monday-to-Sunday weeks).
 *
 * Pure; see cycle.test.ts.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type { ProtocolLike } from '../types'
import { stepWindows, type StepWindow } from './schedule'

/** A change this close needs the user's decision: go up, or hold one more week. */
export const DECISION_DAYS = 3

export type CyclePhase = 'before' | 'dosing' | 'rest' | 'maintenance' | 'finished'

export type ChangeKind =
  /** The dose goes up. The moment to decide: tolerated well enough? */
  | 'increase'
  | 'decrease'
  /** A new step with the same dose (e.g. a label change). */
  | 'same'
  /** The next step is a pause: the cycle's dosing weeks are over. */
  | 'rest'
  /** A pause ends and dosing resumes. */
  | 'resume'
  /** The plan ends here and nothing follows. */
  | 'end'

export interface CycleStep {
  index: number
  doseMg: number
  pause: boolean
  label?: string
  startsOn: Date
  /** Null for an open-ended step (maintenance). */
  endsOn: Date | null
  weeks: number | null
}

export interface CycleChange {
  /** The day the next step begins. */
  on: Date
  daysAway: number
  kind: ChangeKind
  /** Dose after the change in mg; 0 for a pause, null when the plan ends. */
  doseMg: number | null
  stepIndex: number | null
}

export interface CycleInfo {
  startsOn: Date
  /** End of the finite plan, null when it ends in an open step. */
  endsOn: Date | null
  /** 1 on the first week; 0 before the start. */
  week: number
  /** Weeks of the whole plan including rest; null when open-ended. */
  totalWeeks: number | null
  /** Weeks with a dose, without the pauses; null when open-ended. */
  doseWeeks: number | null
  /** Weeks of pause in the plan. */
  restWeeks: number
  phase: CyclePhase
  step: CycleStep | null
  /** 1-based position of the current step. */
  stepNumber: number
  stepCount: number
  /** 1-based week within the current step. */
  weekInStep: number
  stepWeeks: number | null
  /** n-th week with a dose ("week 3 of 12"), null during a pause or before the start. */
  doseWeek: number | null
  next: CycleChange | null
  /** Share of the plan already behind us, null when open-ended. */
  fraction: number | null
  /** The next change is an increase that is close enough to decide on. */
  decisionDue: boolean
  steps: CycleStep[]
}

const toStep = (w: StepWindow): CycleStep => ({
  index: w.index,
  doseMg: w.step.pause ? 0 : w.step.doseMg,
  pause: Boolean(w.step.pause),
  ...(w.step.label ? { label: w.step.label } : {}),
  startsOn: w.start,
  endsOn: w.end,
  weeks: w.step.durationWeeks ?? null,
})

function changeKind(current: CycleStep | null, next: CycleStep | undefined): ChangeKind {
  if (!next) return 'end'
  if (next.pause) return 'rest'
  if (current?.pause) return 'resume'
  const cur = current?.doseMg ?? 0
  if (next.doseMg > cur + 1e-9) return 'increase'
  if (next.doseMg < cur - 1e-9) return 'decrease'
  return 'same'
}

export function cycleInfo(protocol: ProtocolLike, now: Date): CycleInfo | null {
  const windows = stepWindows(protocol)
  if (windows.length === 0) return null
  const steps = windows.map(toStep)
  const today = startOfDay(now)
  const startsOn = steps[0]!.startsOn
  const last = steps.at(-1)!
  const endsOn = last.endsOn

  const totalWeeks = steps.every((s) => s.weeks !== null)
    ? steps.reduce((sum, s) => sum + (s.weeks ?? 0), 0)
    : null
  const restWeeks = steps.filter((s) => s.pause).reduce((sum, s) => sum + (s.weeks ?? 0), 0)
  const doseWeeks = totalWeeks === null ? null : totalWeeks - restWeeks

  const daysSinceStart = differenceInCalendarDays(today, startsOn)
  const week = daysSinceStart < 0 ? 0 : Math.floor(daysSinceStart / 7) + 1

  const current =
    steps.find((s) => today >= s.startsOn && (s.endsOn === null || today < s.endsOn)) ?? null
  const finished = endsOn !== null && today >= endsOn
  const phase: CyclePhase =
    daysSinceStart < 0
      ? 'before'
      : finished
        ? 'finished'
        : current?.pause
          ? 'rest'
          : current && current.endsOn === null
            ? 'maintenance'
            : 'dosing'

  const stepDays = current ? differenceInCalendarDays(today, current.startsOn) : 0
  const weekInStep = current ? Math.floor(stepDays / 7) + 1 : 0

  // Weeks with a dose that are already behind us, plus this one.
  let doseWeek: number | null = null
  if (current && !current.pause) {
    const before = steps
      .filter((s) => !s.pause && s.endsOn !== null && s.endsOn <= current.startsOn)
      .reduce((sum, s) => sum + (s.weeks ?? 0), 0)
    doseWeek = before + weekInStep
  }

  const upcoming = current ? steps[current.index + 1] : daysSinceStart < 0 ? steps[0] : undefined
  let next: CycleChange | null = null
  if (current && current.endsOn) {
    next = {
      on: current.endsOn,
      daysAway: differenceInCalendarDays(current.endsOn, today),
      kind: changeKind(current, upcoming),
      doseMg: upcoming ? upcoming.doseMg : null,
      stepIndex: upcoming?.index ?? null,
    }
  } else if (!current && daysSinceStart < 0) {
    next = {
      on: startsOn,
      daysAway: -daysSinceStart,
      kind: 'increase',
      doseMg: steps[0]!.doseMg,
      stepIndex: 0,
    }
  }

  const fraction =
    endsOn === null
      ? null
      : Math.min(
          1,
          Math.max(0, daysSinceStart / Math.max(1, differenceInCalendarDays(endsOn, startsOn))),
        )

  return {
    startsOn,
    endsOn,
    week,
    totalWeeks,
    doseWeeks,
    restWeeks,
    phase,
    step: current,
    stepNumber: current ? current.index + 1 : 0,
    stepCount: steps.length,
    weekInStep,
    stepWeeks: current?.weeks ?? null,
    doseWeek,
    next,
    fraction,
    decisionDue: next?.kind === 'increase' && phase !== 'before' && next.daysAway <= DECISION_DAYS,
    steps,
  }
}
