import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { driftKey } from './drift'
import { decisionKey } from './decision'
import { activeCycles, attention, protocolDoses } from './items'

const W15 = [1, 2, 3, 4, 5]
const STEPS = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
]
const protocol = (over: Partial<ProtocolRow> = {}): ProtocolRow => ({
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC + Ipa',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: STEPS,
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '2026-09-21T10:00:00Z',
  updated_at: '',
  ...over,
})
const dose = (iso: string, mg: number, over: Partial<DoseRow> = {}): DoseRow => ({
  id: iso,
  patient_id: 'u',
  protocol_id: 'cjc',
  compound_id: 'mod-grf-1-29',
  dose_mg: mg,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  planned_at: null,
  notes: null,
  created_at: '',
  ...over,
})
const NIGHTS = ['2026-09-29T01:05', '2026-09-30T00:40', '2026-10-01T01:10', '2026-10-02T00:55']
const onPlan = NIGHTS.map((iso) => dose(iso, 0.15))
// Raised by feel from Wednesday: three nights at 200 mcg (Wed, Thu, Fri).
const raised = [
  ...onPlan.slice(0, 2),
  ...['2026-10-01T01:10', '2026-10-02T00:55', '2026-10-03T01:20'].map((iso) => dose(iso, 0.2)),
]
const SUNDAY = new Date('2026-10-04T20:30')

describe('activeCycles', () => {
  it('lists active protocols with steps, the oldest first', () => {
    const list = activeCycles(
      [
        protocol({ id: 'b', created_at: '2026-09-22T00:00:00Z' }),
        protocol({ id: 'paused', status: 'paused' }),
        protocol({ id: 'a', created_at: '2026-09-21T00:00:00Z' }),
        protocol({ id: 'empty', steps: [] }),
        protocol({ id: 'old', status: 'archived' }),
      ],
      SUNDAY,
    )
    expect(list.map((c) => c.protocol.id)).toEqual(['a', 'b'])
    expect(list[0]!.info.week).toBe(2)
  })
})

describe('protocolDoses', () => {
  it("keeps the primary compound's doses, under this protocol or logged freely", () => {
    const rows = [
      dose('2026-10-01T01:00', 0.15),
      dose('2026-10-02T01:00', 0.15, { protocol_id: null }),
      dose('2026-10-03T01:00', 0.15, { protocol_id: 'other' }),
      dose('2026-10-01T01:00', 0.15, { compound_id: 'ipamorelin' }),
    ]
    expect(protocolDoses(protocol(), rows).map((r) => r.administered_at)).toEqual([
      rows[0]!.administered_at,
      rows[1]!.administered_at,
    ])
  })
})

describe('attention', () => {
  const cycle = () => activeCycles([protocol()], SUNDAY)[0]!

  it('asks about the step-up the day before when the doses follow the plan', () => {
    const a = attention(cycle(), onPlan, new Set(), SUNDAY)
    expect(a.drift).toBeNull()
    expect(a.decision).toMatchObject({ kind: 'increase', daysAway: 1 })
  })

  it('puts the drift first and holds the decision back while it is unresolved', () => {
    const a = attention(cycle(), raised, new Set(), SUNDAY)
    expect(a.drift).toMatchObject({
      plannedMg: 0.15,
      actualMg: 0.2,
      doses: 3,
      matchesNextStep: true,
    })
    expect(a.decision).toBeNull()
  })

  it('brings the decision back once the drift was dismissed as a one-off', () => {
    const key = driftKey('cjc', new Date('2026-09-30T00:00'))
    const a = attention(cycle(), raised, new Set([key]), SUNDAY)
    expect(a.drift).toBeNull()
    expect(a.decision).toMatchObject({ kind: 'increase' })
  })

  it('does not announce a step-up the doses already took, on the day it starts', () => {
    const monday = new Date('2026-10-05T08:00')
    const c = activeCycles([protocol()], monday)[0]!
    // Raised by feel on Wednesday: on Monday the plan says what they already take.
    expect(attention(c, raised, new Set(), monday)).toEqual({ drift: null, decision: null })
    // Unless those doses were said to be a one-off.
    const oneOff = new Set([driftKey('cjc', new Date('2026-09-30T00:00'))])
    expect(attention(c, raised, oneOff, monday).decision).toMatchObject({
      kind: 'increase',
      timing: 'today',
    })
    // With the doses on plan the step-up is announced as usual.
    expect(attention(c, onPlan, new Set(), monday).decision).toMatchObject({ timing: 'today' })
  })

  it('stops asking on the day of the step once its dose was taken at the new dose', () => {
    // A morning protocol: the Monday step's shot is at 09:00. Before it the question stays;
    // once it is taken at 200 mcg the person went ahead and there is nothing to decide.
    const morning = protocol({ times: ['09:00'], time_of_day: '09:00' })
    const days = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']
    const week = days.map((d) => dose(`${d}T09:05`, 0.15))
    const early = new Date('2026-10-05T08:00')
    const later = new Date('2026-10-05T10:00')
    const c = activeCycles([morning], early)[0]!
    expect(attention(c, week, new Set(), early).decision).toMatchObject({
      kind: 'increase',
      timing: 'today',
    })
    const ahead = [...week, dose('2026-10-05T09:10', 0.2)]
    expect(attention(c, ahead, new Set(), later).decision).toBeNull()
    // Taken at the old dose it is not an answer: the question stays.
    const held = [...week, dose('2026-10-05T09:10', 0.15)]
    expect(attention(c, held, new Set(), later).decision).not.toBeNull()
  })

  it('leaves out a decision that was already answered', () => {
    const c = cycle()
    const key = decisionKey('cjc', attention(c, onPlan, new Set(), SUNDAY).decision!)
    expect(key).toBe('step:cjc:2')
    expect(attention(c, onPlan, new Set([key]), SUNDAY)).toEqual({ drift: null, decision: null })
  })

  it('shows a far-off change only to someone who tapped the notification', () => {
    const early = new Date('2026-09-29T10:00')
    const c = activeCycles([protocol()], early)[0]!
    expect(attention(c, [], new Set(), early).decision).toBeNull()
    expect(attention(c, [], new Set(), early, true).decision).toMatchObject({ daysAway: 6 })
  })
})
