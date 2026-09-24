import { describe, expect, it } from 'vitest'
import type { ProtocolRow } from './database.types'
import { parseComponents, parseSteps, protocolCompoundIds, toProtocolLike } from './mappers'

const row = (over: Partial<ProtocolRow> = {}): ProtocolRow => ({
  id: 'p1',
  patient_id: 'u1',
  created_by: 'u1',
  compound_id: 'mod-grf-1-29',
  name: 'CJC + Ipa',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-03-02',
  time_of_day: '09:00',
  times: ['22:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [5, 1, 2, 3, 4], durationWeeks: 8 }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
  ...over,
})

describe('parseSteps', () => {
  it('keeps weekday and pause steps and sorts weekdays', () => {
    const steps = parseSteps([
      { doseMg: 0.1, intervalDays: 1, weekdays: [5, 1, 1, 9], durationWeeks: 8 },
      { pause: true, durationWeeks: 4 },
    ])
    expect(steps[0]!.weekdays).toEqual([1, 5])
    expect(steps[1]).toEqual({ doseMg: 0, intervalDays: 1, durationWeeks: 4, pause: true })
  })

  it('drops malformed steps instead of throwing', () => {
    expect(parseSteps([null, { doseMg: 0 }, { doseMg: 'x', intervalDays: 7 }, 'nope'])).toEqual([])
    expect(parseSteps('not an array')).toEqual([])
  })
})

describe('parseComponents', () => {
  it('keeps valid components only', () => {
    expect(
      parseComponents([
        { compoundId: 'ipamorelin', doseMg: 0.1 },
        { compoundId: 'x' },
        { doseMg: 1 },
      ]),
    ).toEqual([{ compoundId: 'ipamorelin', doseMg: 0.1 }])
  })
})

describe('toProtocolLike', () => {
  it('prefers the times array and falls back to the legacy column', () => {
    expect(toProtocolLike(row()).times).toEqual(['22:00'])
    expect(toProtocolLike(row({ times: [], time_of_day: '07:30:00' })).times).toEqual(['07:30'])
  })

  it('lists every compound of a stack, primary first', () => {
    expect(protocolCompoundIds(row())).toEqual(['mod-grf-1-29', 'ipamorelin'])
  })
})
