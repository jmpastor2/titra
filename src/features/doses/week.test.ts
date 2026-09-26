import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { summariseWeek, weekPlanVsActual } from './week'

const protocol: ProtocolRow = {
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '22:00',
  times: ['22:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

const dose = (iso: string): DoseRow => ({
  id: iso,
  patient_id: 'u',
  protocol_id: 'cjc',
  compound_id: 'mod-grf-1-29',
  dose_mg: 0.1,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  notes: null,
  created_at: '',
})

describe('weekPlanVsActual', () => {
  it('puts a dose taken after midnight on the evening it was due, with its delay', () => {
    const doses = [
      dose('2026-09-21T22:05'),
      dose('2026-09-22T22:10'),
      // Wednesday forgotten
      dose('2026-09-24T21:20'),
      dose('2026-09-26T00:02'), // Friday's 22:00, after a late dinner
    ]
    const days = weekPlanVsActual(
      [protocol],
      doses,
      new Date('2026-09-21T00:00'),
      new Date('2026-09-26T01:00'),
    )
    const fri = days[4]!.cells[0]!
    expect(fri.status).toBe('late')
    expect(fri.deltaMin).toBe(122)
    expect(fri.takenAt).toEqual(new Date('2026-09-26T00:02'))
    expect(days[2]!.cells[0]!.status).toBe('missed')
    expect(days[3]!.cells[0]!.status).toBe('early')
    expect(days[5]!.cells).toEqual([]) // Saturday: rest day
    expect(summariseWeek(days)).toEqual({ planned: 5, taken: 4, onTime: 2, offTime: 2, missed: 1 })
  })

  it('marks what is still ahead as upcoming and leaves it out of the summary', () => {
    const days = weekPlanVsActual(
      [protocol],
      [],
      new Date('2026-09-21T00:00'),
      new Date('2026-09-21T12:00'),
    )
    expect(days[0]!.cells[0]!.status).toBe('upcoming')
    expect(summariseWeek(days).planned).toBe(0)
  })
})

describe('off-schedule doses in the week', () => {
  it('lists a rest-day shot as extra without touching the plan', () => {
    const days = weekPlanVsActual(
      [protocol],
      [dose('2026-09-26T00:02'), dose('2026-09-26T02:40')],
      new Date('2026-09-21T00:00'),
      new Date('2026-09-26T03:00'),
    )
    expect(days[4]!.cells[0]!.status).toBe('late')
    expect(days[5]!.cells.map((c) => c.status)).toEqual(['extra'])
  })
})
