import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { blendDose, cjcProtocol, doseRow } from './testData'
import { doseCells, protocolDoseRows, summariseWeek, weekPlanVsActual } from './week'

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
  planned_at: null,
  notes: null,
  created_at: '',
})

describe('weekPlanVsActual', () => {
  it('puts a dose taken after midnight on the evening it was due, with its delay', () => {
    const doses = [
      dose('2026-09-21T22:05'),
      dose('2026-09-22T22:10'),
      // Wednesday forgotten
      dose('2026-09-24T20:50'),
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

  it('does not count an extra as planned or as done', () => {
    const days = weekPlanVsActual(
      [protocol],
      [dose('2026-09-26T00:02'), dose('2026-09-26T02:40')],
      new Date('2026-09-21T00:00'),
      new Date('2026-09-26T03:00'),
    )
    // Four planned nights are missed so far, one taken (late); the extra stays out of it.
    expect(summariseWeek(days)).toEqual({ planned: 5, taken: 1, onTime: 0, offTime: 1, missed: 4 })
  })
})

describe('the administration behind each cell', () => {
  const monday = new Date('2026-09-28T00:00')
  const now = new Date('2026-10-04T12:00')

  it('names the dose that covers a planned administration, and none for a missed one', () => {
    const tue = blendDose('2026-09-30T01:02') // Tuesday night's slot, on time
    const days = weekPlanVsActual([cjcProtocol], [...tue], monday, now)

    const taken = days[1]!.cells[0]!
    expect(taken.status).toBe('onTime')
    expect(taken.doseKey).toBe(tue[0]!.batch_id)
    // Monday night's slot has nobody behind it.
    const missed = days[0]!.cells[0]!
    expect(missed.status).toBe('missed')
    expect(missed.doseKey).toBeUndefined()
  })

  it('names the dose of an extra and of a make-up in the week of the slot it covers', () => {
    const sunday = blendDose('2026-10-04T08:00', {
      planned_at: new Date('2026-09-29T01:00').toISOString(),
    })
    const days = weekPlanVsActual([cjcProtocol], sunday, monday, now)
    const makeUp = days[0]!.cells[0]!
    expect(makeUp.status).toBe('late')
    expect(makeUp.doseKey).toBe(sunday[0]!.batch_id)
    expect(makeUp.takenAt).toEqual(new Date('2026-10-04T08:00'))

    const free = blendDose('2026-10-04T08:00')
    const extra = weekPlanVsActual([cjcProtocol], free, monday, now)[6]!.cells[0]!
    expect(extra.status).toBe('extra')
    expect(extra.doseKey).toBe(free[0]!.batch_id)
  })
})

describe('doseCells', () => {
  it('judges every administration since a date, week by week', () => {
    const doses = [
      ...blendDose('2026-09-22T01:03'),
      ...blendDose('2026-09-23T01:00'),
      ...blendDose('2026-10-04T08:00'),
    ]
    const cells = doseCells(
      [cjcProtocol],
      doses,
      new Date('2026-09-14T00:00'),
      new Date('2026-10-04T12:00'),
    )
    expect([...cells.values()].map((c) => c.status)).toEqual(['onTime', 'onTime', 'extra'])
  })

  it('leaves archived protocols out', () => {
    const row = doseRow('2026-09-22T01:03')
    const cells = doseCells(
      [{ ...cjcProtocol, status: 'archived' }],
      [row],
      new Date('2026-09-14T00:00'),
      new Date('2026-10-04T12:00'),
    )
    expect(cells.size).toBe(0)
  })
})

describe('protocolDoseRows', () => {
  it('keeps the primary compound under this protocol or under none', () => {
    const mine = doseRow('2026-09-22T01:03')
    const free = doseRow('2026-09-23T01:03', { protocol_id: null })
    const other = doseRow('2026-09-24T01:03', { protocol_id: 'someone-else' })
    const partner = doseRow('2026-09-22T01:03', { compound_id: 'ipamorelin' })
    expect(protocolDoseRows(cjcProtocol, [mine, free, other, partner])).toEqual([mine, free])
  })
})
