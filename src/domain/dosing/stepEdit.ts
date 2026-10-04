/**
 * Edits to a protocol's dose steps that people make while following it: hold the
 * current dose one more week because it is not tolerated yet, move up a week sooner,
 * or change the dose of a step. Steps keep their order; later steps shift in time
 * because step windows are cumulative. Pure; see stepEdit.test.ts.
 */
import type { ScheduleStep } from '../types'

/** A step can be lengthened or shortened only while it has a finite duration. */
export function hasFiniteDuration(step: ScheduleStep | undefined): boolean {
  return typeof step?.durationWeeks === 'number' && step.durationWeeks > 0
}

/**
 * Add (or remove, with a negative number) whole weeks to a step. A step never drops
 * below one week. Open-ended steps (maintenance) are left as they are.
 */
export function adjustStepWeeks(
  steps: readonly ScheduleStep[],
  index: number,
  deltaWeeks: number,
): ScheduleStep[] {
  return steps.map((s, i) => {
    if (i !== index || !hasFiniteDuration(s)) return { ...s }
    return { ...s, durationWeeks: Math.max(1, Math.round((s.durationWeeks ?? 1) + deltaWeeks)) }
  })
}

/** Stay one more week on this step: the next dose change moves back a week. */
export function holdStep(steps: readonly ScheduleStep[], index: number): ScheduleStep[] {
  return adjustStepWeeks(steps, index, 1)
}

/** Finish this step a week sooner: the next dose change comes a week earlier. */
export function moveUpStep(steps: readonly ScheduleStep[], index: number): ScheduleStep[] {
  return adjustStepWeeks(steps, index, -1)
}

/** Change the primary dose of one step (mg). Pause steps keep a dose of 0. */
export function setStepDose(
  steps: readonly ScheduleStep[],
  index: number,
  doseMg: number,
): ScheduleStep[] {
  return steps.map((s, i) => (i === index && !s.pause ? { ...s, doseMg } : { ...s }))
}

/** Total weeks of the finite steps, or null when the protocol ends in an open step. */
export function totalWeeks(steps: readonly ScheduleStep[]): number | null {
  let sum = 0
  for (const s of steps) {
    if (s.durationWeeks === null || s.durationWeeks === undefined) return null
    sum += s.durationWeeks
  }
  return sum
}
