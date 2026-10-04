import { describe, expect, it } from 'vitest'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { fingerprint, upcomingAdministrations, upcomingDecisions } from './plan'

const protocol = (over: Partial<ProtocolRow>): ProtocolRow => ({
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC + Ipa',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-03-02',
  time_of_day: '22:00',
  times: ['22:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
  ...over,
})

const RETA = protocol({
  id: 'reta',
  compound_id: 'retatrutide',
  unit: 'mg',
  times: ['09:00'],
  steps: [
    { doseMg: 2, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 4, intervalDays: 7, durationWeeks: null },
  ],
  components: [],
})

const vial = (compound: string, conc: number | null, over: Partial<InventoryRow> = {}) =>
  ({
    id: `v-${compound}-${conc}`,
    patient_id: 'u',
    compound_id: compound,
    form: 'vial',
    label: compound,
    total_mg: 10,
    remaining_mg: 5,
    concentration_mg_per_ml: conc,
    diluent_ml: null,
    opened_at: '2026-03-01',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '',
    updated_at: '',
    ...over,
  }) as InventoryRow

const dose = (compound: string, iso: string, protocolId: string, mg = 0.1): DoseRow => ({
  id: `${compound}-${iso}`,
  patient_id: 'u',
  protocol_id: protocolId,
  compound_id: compound,
  dose_mg: mg,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  planned_at: null,
  notes: null,
  created_at: '',
})

const VIALS = [
  vial('mod-grf-1-29', 1),
  vial('ipamorelin', 2),
  vial('retatrutide', 5),
  vial('retatrutide', null, { id: 'spare', opened_at: null }),
]

describe('upcomingAdministrations', () => {
  it('lists weekday stack administrations with the units to draw', () => {
    // Wednesday 12:00: Wed, Thu, Fri and next Mon, Tue fall within 6 days.
    const now = new Date('2026-03-04T12:00')
    const list = upcomingAdministrations([protocol({})], [], VIALS, now, { horizonDays: 6 })
    expect(list.map((x) => x.at.getDate())).toEqual([4, 5, 6, 9])
    expect(list[0]!.totalUnits).toBe(15)
    expect(list[0]!.loads).toEqual([
      { compoundId: 'mod-grf-1-29', units: 10, to: 10 },
      { compoundId: 'ipamorelin', units: 5, to: 15 },
    ])
    expect(list[0]!.toleranceMin).toBe(240)
  })

  it('drops an administration already logged early and applies the lead time', () => {
    const now = new Date('2026-03-04T21:30')
    const doses = [dose('mod-grf-1-29', '2026-03-04T21:20', 'cjc')]
    const list = upcomingAdministrations([protocol({})], doses, VIALS, now, {
      leadMin: 15,
      horizonDays: 2,
    })
    expect(list.map((x) => x.at.getDate())).toEqual([5])
    expect(list[0]!.fireAt).toEqual(new Date('2026-03-05T21:45'))
  })

  it('anchors a weekly shot to the last real dose and follows the titration', () => {
    const doses = [2, 9, 16, 23].map((d) =>
      dose('retatrutide', `2026-03-${String(d).padStart(2, '0')}T09:30`, 'reta'),
    )
    const now = new Date('2026-03-24T12:00')
    const list = upcomingAdministrations([RETA], doses, VIALS, now, { horizonDays: 15 })
    expect(list.map((x) => [x.at.getDate(), x.doses[0]!.doseMg])).toEqual([
      [30, 4],
      [6, 4],
    ])
    // 4 mg from the reconstituted 5 mg/mL vial, not the spare lyophilised one.
    expect(list[0]!.totalUnits).toBe(80)
    expect(list[0]!.toleranceMin).toBe(24 * 60)
  })

  it('skips paused protocols and leaves units empty without a known vial', () => {
    const now = new Date('2026-03-04T12:00')
    expect(upcomingAdministrations([protocol({ status: 'paused' })], [], VIALS, now)).toEqual([])
    const noVials = upcomingAdministrations([protocol({})], [], [], now, { horizonDays: 1 })
    expect(noVials[0]!.totalUnits).toBeNull()
    expect(noVials[0]!.loads).toBeNull()
  })
})

describe('fingerprint', () => {
  it('changes with the content and is stable otherwise', () => {
    const a = [{ x: 1 }]
    expect(fingerprint(a)).toBe(fingerprint([{ x: 1 }]))
    expect(fingerprint(a)).not.toBe(fingerprint([{ x: 2 }]))
  })
})

describe('upcomingDecisions', () => {
  const W15 = [1, 2, 3, 4, 5]
  const dosing = (doseMg: number, durationWeeks: number) => ({
    doseMg,
    intervalDays: 1,
    weekdays: W15,
    durationWeeks,
  })
  // 6 → 9 → 12 U of the blend, then four weeks of rest. Starts Monday Sep 21: the step to
  // 12 U begins on Monday Oct 5.
  const steps = [
    dosing(0.1, 1),
    dosing(0.15, 1),
    dosing(0.2, 10),
    { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
  ]
  const CJC = protocol({ start_date: '2026-09-21', times: ['25:00'], steps })
  const BLEND = vial('mod-grf-1-29', 5 / 3, {
    id: 'blend',
    total_mg: 5,
    remaining_mg: 5,
    components: [{ compoundId: 'ipamorelin', mg: 5 }],
  })
  const raised = [
    '2026-10-01T01:10', // Wed night
    '2026-10-02T00:55',
    '2026-10-03T01:20',
  ].map((iso) => dose('mod-grf-1-29', iso, 'cjc', 0.2))
  const SUNDAY_NOON = new Date('2026-10-04T12:00')

  it('asks at 20:00 the evening before a step-up, with the units of both doses', () => {
    const list = upcomingDecisions([CJC], [BLEND], SUNDAY_NOON)
    expect(list).toHaveLength(1)
    const d = list[0]!
    expect(d.stepIndex).toBe(2)
    expect(d.on).toEqual(new Date('2026-10-05T00:00'))
    expect(d.fireAt).toEqual(new Date('2026-10-04T20:00'))
    expect(d.occurrenceAt).toEqual(new Date('2026-10-05T00:00:01'))
    expect(d.from).toEqual({ mg: 0.15, units: 9 })
    expect(d.to).toEqual({ mg: 0.2, units: 12 })
  })

  it('looks as far ahead as asked, soonest first', () => {
    const tuesday = new Date('2026-09-22T12:00')
    const both = upcomingDecisions([CJC], [BLEND], tuesday)
    expect(both.map((d) => d.stepIndex)).toEqual([1, 2])
    expect(both.map((d) => d.fireAt)).toEqual([
      new Date('2026-09-27T20:00'),
      new Date('2026-10-04T20:00'),
    ])
    expect(upcomingDecisions([CJC], [BLEND], tuesday, { horizonDays: 7 })).toHaveLength(1)
  })

  it('does not ask once the evening has passed or the decision was answered', () => {
    expect(upcomingDecisions([CJC], [BLEND], new Date('2026-10-04T21:00'))).toEqual([])
    const answered = new Set(['step:cjc:2'])
    expect(upcomingDecisions([CJC], [BLEND], SUNDAY_NOON, { dismissed: answered })).toEqual([])
  })

  it('moves with a held week', () => {
    const held = protocol({
      start_date: '2026-09-21',
      times: ['25:00'],
      steps: [dosing(0.1, 1), dosing(0.15, 2), dosing(0.2, 10)],
    })
    const [d] = upcomingDecisions([held], [BLEND], SUNDAY_NOON)
    expect(d?.on).toEqual(new Date('2026-10-12T00:00'))
    expect(d?.fireAt).toEqual(new Date('2026-10-11T20:00'))
  })

  it('asks only about increases of active protocols', () => {
    const down = protocol({
      start_date: '2026-09-21',
      times: ['25:00'],
      steps: [dosing(0.2, 2), dosing(0.1, 2)],
    })
    expect(upcomingDecisions([down], [BLEND], SUNDAY_NOON)).toEqual([])
    // Into a rest is not an increase either: the dosing weeks end on Monday Dec 14.
    expect(upcomingDecisions([CJC], [BLEND], new Date('2026-12-11T12:00'))).toEqual([])
    expect(upcomingDecisions([{ ...CJC, status: 'paused' }], [BLEND], SUNDAY_NOON)).toEqual([])
  })

  it('says nothing about the units without a vial that tells how to draw', () => {
    const [d] = upcomingDecisions([CJC], [], SUNDAY_NOON)
    expect(d?.from).toEqual({ mg: 0.15, units: null })
    expect(d?.to).toEqual({ mg: 0.2, units: null })
  })

  it('waits while the doses taken disagree with the plan, and asks again once that is settled', () => {
    // 200 mcg since Wednesday against a plan of 150: announcing "up to 200" would mislead.
    expect(upcomingDecisions([CJC], [BLEND], SUNDAY_NOON, { doses: raised })).toEqual([])
    const oneOff = new Set(['drift:cjc:2026-09-30'])
    const list = upcomingDecisions([CJC], [BLEND], SUNDAY_NOON, {
      doses: raised,
      dismissed: oneOff,
    })
    expect(list).toHaveLength(1)
  })
})
