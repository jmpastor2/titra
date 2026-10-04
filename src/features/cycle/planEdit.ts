/**
 * Edits to a protocol's plan that follow from what the person actually does. Pure; see
 * planEdit.test.ts.
 */
import { setStepDose } from '@/domain/dosing/stepEdit'
import type { ScheduleStep, StackComponent } from '@/domain/types'

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

/**
 * Change the dose of one step. The compounds that ride along in the syringe or blend vial are
 * stored for the first dosing step and follow every other step in proportion, so changing
 * that first step rescales them too and the blend keeps its ratio.
 */
export function withStepDose(
  steps: readonly ScheduleStep[],
  components: readonly StackComponent[],
  index: number,
  doseMg: number,
): { steps: ScheduleStep[]; components: StackComponent[] } {
  const first = steps.findIndex((s) => !s.pause && s.doseMg > 0)
  const base = steps[first]?.doseMg
  const k = index === first && base ? doseMg / base : 1
  return {
    steps: setStepDose(steps, index, doseMg),
    components: components.map((c) => ({ ...c, doseMg: round6(c.doseMg * k) })),
  }
}
