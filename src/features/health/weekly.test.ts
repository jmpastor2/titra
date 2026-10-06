import { describe, expect, it } from 'vitest'
import type { MeasurementKind, ProtocolRow } from '@/data/database.types'
import type { TimePoint } from './progress'
import { stepItems, weekChanges, type WeekInput } from './weekly'

const now = new Date(2026, 8, 30, 14) // Wednesday
const at = (d: number, h = 8) => new Date(2026, 8, d, h)
const p = (d: number, value: number): TimePoint => ({ at: at(d), value })

function reta(over: Partial<ProtocolRow> = {}): ProtocolRow {
  return {
    id: 'reta',
    patient_id: 'p',
    created_by: null,
    compound_id: 'retatrutide',
    name: 'Retatrutida',
    route: 'sc',
    unit: 'mg',
    // Steps of 2 weeks from Mon 7 Sep: 1 → 1.5 (21 Sep) → 1.75 (5 Oct, next Monday).
    start_date: '2026-09-07',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [
      { doseMg: 1, intervalDays: 7, durationWeeks: 2 },
      { doseMg: 1.5, intervalDays: 7, durationWeeks: 2 },
      { doseMg: 1.75, intervalDays: 7, durationWeeks: null },
    ],
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...over,
  }
}

function input(over: Partial<WeekInput> = {}): WeekInput {
  return {
    now,
    weight: [],
    waist: [],
    scores: new Map(),
    checkInDays: new Set(),
    adherence: { taken: 0, expected: 0, ratio: null },
    timing: null,
    symptoms: [],
    protocols: [],
    ...over,
  }
}

describe('weekChanges', () => {
  it('is empty without data', () => {
    expect(weekChanges(input())).toEqual([])
  })

  it('compares this week’s weight with last week’s', () => {
    const items = weekChanges(input({ weight: [p(18, 78), p(21, 78.2), p(25, 77.5), p(28, 77)] }))
    expect(items[0]).toMatchObject({ kind: 'body', metric: 'weight' })
    expect(items[0]!.kind === 'body' && items[0]!.delta).toBeCloseTo(-0.85, 6)
  })

  it('counts weigh-in days when there is no previous week yet', () => {
    const twice = { at: new Date(2026, 8, 28, 21), value: 77.2 }
    const items = weekChanges(input({ weight: [p(25, 77.5), p(26, 78.01), p(28, 77), twice] }))
    expect(items).toEqual([{ kind: 'weighIns', count: 3 }])
  })

  it('reports adherence, with how many doses were off time', () => {
    const items = weekChanges(
      input({
        adherence: { taken: 8, expected: 8, ratio: 1 },
        timing: { onTime: 6, offTime: 2 },
      }),
    )
    expect(items).toEqual([{ kind: 'adherence', taken: 8, expected: 8, offTime: 2 }])
  })

  it('says every dose was on time with a zero, and nothing about timing when it is not known', () => {
    const adherence = { taken: 8, expected: 8, ratio: 1 }
    expect(weekChanges(input({ adherence, timing: { onTime: 8, offTime: 0 } }))).toEqual([
      { kind: 'adherence', taken: 8, expected: 8, offTime: 0 },
    ])
    expect(weekChanges(input({ adherence }))).toEqual([
      { kind: 'adherence', taken: 8, expected: 8, offTime: null },
    ])
  })

  it('has no adherence line when nothing was due, even with doses taken', () => {
    expect(weekChanges(input({ timing: { onTime: 3, offTime: 0 } }))).toEqual([])
  })

  it('names the wellbeing dimension that moved most, else counts check-ins', () => {
    const scores = new Map<MeasurementKind, TimePoint[]>([
      ['energy', [p(20, 6), p(27, 8)]],
      ['mood', [p(20, 7), p(27, 7.2)]],
    ])
    expect(weekChanges(input({ scores }))).toEqual([{ kind: 'score', metric: 'energy', delta: 2 }])
    const single = weekChanges(
      input({
        scores: new Map([['energy', [p(26, 8)]]]),
        checkInDays: new Set([new Date(2026, 8, 26).getTime()]),
      }),
    )
    expect(single).toEqual([{ kind: 'checkIns', count: 1 }])
  })

  it('summarises symptoms with the repeated one', () => {
    const items = weekChanges(
      input({
        symptoms: [
          { at: at(28), kind: 'nausea' },
          { at: at(29), kind: 'nausea' },
          { at: at(29), kind: 'headache' },
          { at: at(10), kind: 'fatigue' },
        ],
      }),
    )
    expect(items).toEqual([{ kind: 'symptoms', count: 3, top: 'nausea' }])
  })
})

describe('stepItems', () => {
  it('announces the next dose step within a week', () => {
    const items = stepItems([reta()], now)
    expect(items).toHaveLength(1)
    const item = items[0]!
    expect(item.kind).toBe('step')
    if (item.kind !== 'step') return
    expect(item.upcoming).toBe(true)
    expect(item.change).toMatchObject({ kind: 'up', doseMg: 1.75, prevDoseMg: 1.5 })
    expect(item.change.at).toEqual(new Date(2026, 9, 5))
  })

  it('also reports a step taken in the last week, and skips inactive protocols', () => {
    const items = stepItems([reta({ start_date: '2026-09-14' })], now)
    expect(items.map((i) => i.kind === 'step' && i.upcoming)).toEqual([false])
    expect(stepItems([reta({ status: 'paused' })], now)).toEqual([])
  })
})
