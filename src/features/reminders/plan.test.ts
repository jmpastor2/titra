import { describe, expect, it } from 'vitest'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { fingerprint, upcomingAdministrations } from './plan'

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

const dose = (compound: string, iso: string, protocolId: string): DoseRow => ({
  id: `${compound}-${iso}`,
  patient_id: 'u',
  protocol_id: protocolId,
  compound_id: compound,
  dose_mg: 0.1,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
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
