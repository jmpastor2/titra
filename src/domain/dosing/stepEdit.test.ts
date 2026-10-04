import { describe, expect, it } from 'vitest'
import type { ScheduleStep } from '../types'
import { adjustStepWeeks, holdStep, moveUpStep, setStepDose, totalWeeks } from './stepEdit'

const CJC: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]

describe('step edits', () => {
  it('holds a step one more week without touching the others', () => {
    const next = holdStep(CJC, 1)
    expect(next.map((s) => s.durationWeeks)).toEqual([1, 2, 10, 4])
    expect(CJC[1]!.durationWeeks).toBe(1) // the input is not mutated
  })

  it('moves up a week sooner but never below one week', () => {
    expect(moveUpStep(CJC, 2).map((s) => s.durationWeeks)).toEqual([1, 1, 9, 4])
    expect(moveUpStep(CJC, 0).map((s) => s.durationWeeks)).toEqual([1, 1, 10, 4])
  })

  it('leaves an open-ended step alone', () => {
    const open: ScheduleStep[] = [{ doseMg: 2.5, intervalDays: 7, durationWeeks: null }]
    expect(adjustStepWeeks(open, 0, 1)[0]!.durationWeeks).toBeNull()
  })

  it('changes the dose of a dose step but not of a pause', () => {
    expect(setStepDose(CJC, 2, 0.25)[2]!.doseMg).toBe(0.25)
    expect(setStepDose(CJC, 3, 0.25)[3]!.doseMg).toBe(0)
  })

  it('adds up the weeks, or null when the plan ends open', () => {
    expect(totalWeeks(CJC)).toBe(16)
    expect(totalWeeks([...CJC, { doseMg: 0.2, intervalDays: 1, durationWeeks: null }])).toBeNull()
  })
})
