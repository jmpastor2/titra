import { describe, expect, it } from 'vitest'
import type { DoseRow } from '@/data/database.types'
import type { ProtocolLike } from '@/domain/types'
import { habitTime } from './habit'

const NIGHT: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: [{ doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
} as unknown as ProtocolLike

const dose = (iso: string): DoseRow =>
  ({
    id: iso,
    patient_id: 'u',
    protocol_id: 'p',
    compound_id: 'mod-grf-1-29',
    dose_mg: 0.2,
    administered_at: new Date(iso).toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: null,
    planned_at: null,
    notes: null,
    created_at: '',
  }) as DoseRow

const NOW = new Date('2026-10-09T12:00')

describe('habitTime', () => {
  it('reads a steady earlier time and rounds it to a quarter of an hour', () => {
    // Planned at 01:00 (25:00); taken between 23:53 and 00:30.
    const doses = [
      '2026-10-01T00:20',
      '2026-10-02T00:10',
      '2026-10-06T00:30',
      '2026-10-06T23:53',
      '2026-10-08T00:23',
      '2026-10-09T00:05',
    ].map(dose)
    expect(habitTime(NIGHT, doses, NOW)).toEqual({ time: '24:15', shiftMin: -45, doses: 6 })
  })

  it('stays quiet when the doses follow the plan', () => {
    const doses = [
      '2026-10-06T01:05',
      '2026-10-07T00:50',
      '2026-10-08T01:10',
      '2026-10-09T00:58',
    ].map(dose)
    expect(habitTime(NIGHT, doses, NOW)).toBeNull()
  })

  it('stays quiet with too few doses or no steady pattern', () => {
    expect(habitTime(NIGHT, ['2026-10-08T00:10', '2026-10-09T00:10'].map(dose), NOW)).toBeNull()
    const scattered = [
      '2026-10-02T00:00',
      '2026-10-06T02:20',
      '2026-10-07T00:10',
      '2026-10-08T02:30',
      '2026-10-09T00:05',
    ].map(dose)
    expect(habitTime(NIGHT, scattered, NOW)).toBeNull()
  })

  it('does not apply to a protocol with several times a day', () => {
    expect(habitTime({ ...NIGHT, times: ['09:00', '21:00'] }, [], NOW)).toBeNull()
  })
})
