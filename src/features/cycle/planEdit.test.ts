import { describe, expect, it } from 'vitest'
import type { ScheduleStep, StackComponent } from '@/domain/types'
import { withStepDose } from './planEdit'

const W15 = [1, 2, 3, 4, 5]
const STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
const PARTNER: StackComponent[] = [{ compoundId: 'ipamorelin', doseMg: 0.1 }]

describe('withStepDose', () => {
  it('changes one step and leaves the partner alone: it follows the first step in proportion', () => {
    const out = withStepDose(STEPS, PARTNER, 1, 0.2)
    expect(out.steps.map((s) => s.doseMg)).toEqual([0.1, 0.2, 0.2, 0])
    expect(out.components).toEqual(PARTNER)
    // The input is not touched.
    expect(STEPS[1]!.doseMg).toBe(0.15)
  })

  it('rescales the partner when the first dosing step changes, so the blend keeps its ratio', () => {
    const out = withStepDose(STEPS, PARTNER, 0, 0.15)
    expect(out.steps[0]!.doseMg).toBe(0.15)
    expect(out.components).toEqual([{ compoundId: 'ipamorelin', doseMg: 0.15 }])
  })

  it('does not touch a pause', () => {
    expect(withStepDose(STEPS, PARTNER, 3, 0.2).steps[3]!.doseMg).toBe(0)
  })
})
