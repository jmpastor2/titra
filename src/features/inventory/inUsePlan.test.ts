import { describe, expect, it } from 'vitest'
import type { ProtocolRow } from '@/data/database.types'
import { inUsePlan, proposeWater } from './inUsePlan'

const protocol = (over: Partial<ProtocolRow>): ProtocolRow =>
  ({
    id: 'p',
    patient_id: 'u',
    created_by: 'u',
    compound_id: 'ghk-cu',
    name: 'KLOW',
    route: 'sc',
    unit: 'mg',
    start_date: '2026-10-12',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [{ doseMg: 1.666667, intervalDays: 1, durationWeeks: 4 }],
    components: [{ compoundId: 'bpc-157', doseMg: 0.333333 }],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...over,
  }) as ProtocolRow

describe('proposeWater', () => {
  it('finds the water that makes the dose a whole number of units near 10', () => {
    // KLOW: 1,67 mg of GHK-Cu from 50 mg: 3 mL gives exactly 10 U.
    expect(proposeWater(1.666667, 50, 30)).toEqual({ waterMl: 3, units: 10 })
    // MOTS-c 1,5 mg from 10 mg: 1 mL gives 15 U; 0,5 mL would be 7,5 U (not whole).
    expect(proposeWater(1.5, 10, 30)).toEqual({ waterMl: 1, units: 15 })
  })

  it('keeps the dose inside the barrel', () => {
    // 2 mg from 10 mg: 1 mL is 20 U; in a 0,3 mL (30 U) barrel that fits, 2 mL (40 U) would not.
    const p = proposeWater(2, 10, 30)
    expect(p!.units).toBeLessThanOrEqual(30)
  })
})

describe('inUsePlan', () => {
  it('walks the 28 days of a daily protocol: what is used and what is left', () => {
    const vial = { compound_id: 'ghk-cu', total_mg: 50, remaining_mg: 50 }
    const plan = inUsePlan(vial, [protocol({})], new Date('2026-10-12T00:00'), 30)
    // 28 days, one a day: 28 × 1,67 ≈ 46,7 mg used, ≈ 3,3 mg left when the 28 days end.
    expect(plan).toMatchObject({ doses: 28, planned: 28, runsOutAt: null, waterMl: 3, units: 10 })
    expect(plan!.usedMg).toBeCloseTo(46.67, 1)
    expect(plan!.leftMg).toBeCloseTo(3.33, 1)
  })

  it('says when it runs out inside the period', () => {
    const vial = { compound_id: 'ghk-cu', total_mg: 50, remaining_mg: 10 }
    const plan = inUsePlan(vial, [protocol({})], new Date('2026-10-12T00:00'), 30)
    expect(plan!.doses).toBe(5)
    expect(plan!.runsOutAt).toEqual(new Date('2026-10-17T09:00'))
    expect(plan!.leftMg).toBe(0)
  })

  it('counts a compound that rides along in another protocol', () => {
    const vial = { compound_id: 'bpc-157', total_mg: 10, remaining_mg: 10 }
    const plan = inUsePlan(vial, [protocol({})], new Date('2026-10-12T00:00'), 30)
    expect(plan!.doses).toBe(28)
    expect(plan!.usedMg).toBeCloseTo(9.33, 1)
  })

  it('is nothing without an active protocol that uses it', () => {
    const vial = { compound_id: 'mots-c', total_mg: 10, remaining_mg: 10 }
    expect(inUsePlan(vial, [protocol({})], new Date('2026-10-12T00:00'), 30)).toBeNull()
  })
})
