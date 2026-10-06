/**
 * A cycle week by week, for the strip of a cycle card: which weeks give a dose and how big,
 * which are rest, which are behind us and which one is today. A step with no end (maintenance)
 * is drawn as a couple of weeks that fade out. Pure; see phase.test.ts.
 */
import { addDays, startOfDay } from 'date-fns'
import type { CycleInfo } from '@/domain/dosing/cycle'

/** Weeks an open-ended step is drawn as. */
const OPEN_WEEKS = 2

export type WeekState = 'past' | 'current' | 'future'

export interface PhaseWeek {
  /** Unique within a cycle: the step and the week of it. */
  key: string
  /** The step it belongs to (an index into `info.steps`). */
  stepIndex: number
  kind: 'dose' | 'rest'
  /** The n-th week with a dose ("week 3 of 12"); null in a rest week. */
  n: number | null
  doseMg: number
  /** The dose against the cycle's largest, 0–1; 0 for a rest. */
  intensity: number
  state: WeekState
  /** The step has no end: this week stands for all that follow. */
  open: boolean
}

export function phaseWeeks(info: Pick<CycleInfo, 'steps' | 'phase'>, now: Date): PhaseWeek[] {
  const today = startOfDay(now)
  const maxDose = Math.max(0, ...info.steps.filter((s) => !s.pause).map((s) => s.doseMg))
  const weeks: PhaseWeek[] = []
  let n = 0
  for (const step of info.steps) {
    const count = step.weeks ?? OPEN_WEEKS
    for (let k = 0; k < count; k++) {
      const from = addDays(step.startsOn, k * 7)
      const to = addDays(from, 7)
      if (!step.pause) n += 1
      weeks.push({
        key: `${step.index}.${k}`,
        stepIndex: step.index,
        kind: step.pause ? 'rest' : 'dose',
        n: step.pause ? null : n,
        doseMg: step.doseMg,
        intensity: step.pause || maxDose === 0 ? 0 : step.doseMg / maxDose,
        state: today >= to ? 'past' : today < from ? 'future' : 'current',
        open: step.weeks === null && k === count - 1,
      })
    }
  }
  // Maintenance goes on past the weeks drawn: the last one is today.
  if (info.phase === 'maintenance' && !weeks.some((w) => w.state === 'current')) {
    const last = weeks.at(-1)
    if (last) last.state = 'current'
  }
  return weeks
}

/** The step a tap on the cycle opens: today's, else the next to come, else the last. */
export function focusStep(info: Pick<CycleInfo, 'steps' | 'step'>, now: Date): number {
  const today = startOfDay(now)
  return (
    info.step?.index ??
    info.steps.find((s) => s.startsOn > today)?.index ??
    info.steps.at(-1)?.index ??
    0
  )
}
