import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import { cycleSummary, doseView, fmtDoseLine, fmtDoseView } from './cycleView'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]

// 6 → 9 → 12 U of the CJC/ipamorelin blend for ten weeks, then four weeks of rest.
const CJC_STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4, label: 'Descanso' },
]
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: CJC_STEPS,
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}

const vial = (over: Partial<InventoryRow> = {}): InventoryRow => ({
  id: 'blend',
  patient_id: 'u',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC-1295 + Ipamorelina 10 mg',
  total_mg: 5,
  remaining_mg: 5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: '2026-09-21',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '',
  updated_at: '',
  ...over,
})

describe('doseView', () => {
  it('draws a blend as one load: 0.2 mg of each is 12 U', () => {
    const v = doseView(CJC, 0.2, [vial()])
    expect(v.units).toBe(12)
    expect(v.parts).toEqual([
      { compoundId: 'mod-grf-1-29', doseMg: 0.2 },
      { compoundId: 'ipamorelin', doseMg: 0.2 },
    ])
    expect(v.plan?.loads).toHaveLength(1)
  })

  it('gives no units without a reconstituted vial', () => {
    expect(doseView(CJC, 0.2, []).units).toBeNull()
    const powder = vial({ concentration_mg_per_ml: null, diluent_ml: null })
    expect(doseView(CJC, 0.2, [powder]).units).toBeNull()
  })

  it('adds up separate vials, one load each', () => {
    const cjcOnly = vial({
      id: 'a',
      components: [],
      total_mg: 5,
      diluent_ml: 5,
      concentration_mg_per_ml: 1,
    })
    const ipaOnly = vial({
      id: 'b',
      compound_id: 'ipamorelin',
      components: [],
      total_mg: 5,
      diluent_ml: 5,
      concentration_mg_per_ml: 1,
    })
    // 0.2 mg of each at 1 mg/mL: 20 U + 20 U.
    expect(doseView(CJC, 0.2, [cjcOnly, ipaOnly]).units).toBe(40)
  })
})

describe('cycleSummary', () => {
  it('week 3 of 12 with 12 U, and the rest that follows', () => {
    const s = cycleSummary(CJC, [vial()], d('2026-10-05T10:00'))!
    expect(s.week).toEqual({ n: 3, of: 12 })
    expect(s.rest).toBeNull()
    expect(s.dose?.units).toBe(12)
    expect(s.next?.change).toMatchObject({ kind: 'rest', daysAway: 70 })
    expect(s.next?.dose).toBeNull()
  })

  it('knows the dose after the next step-up', () => {
    const s = cycleSummary(CJC, [vial()], d('2026-10-04T20:30'))!
    expect(s.week?.n).toBe(2)
    expect(s.dose?.units).toBe(9)
    expect(s.next?.change).toMatchObject({ kind: 'increase', daysAway: 1 })
    expect(s.next?.dose?.units).toBe(12)
    expect(s.info.decisionDue).toBe(true)
  })

  it('counts a rest on its own', () => {
    const s = cycleSummary(CJC, [vial()], d('2026-12-16T10:00'))!
    expect(s.week).toBeNull()
    expect(s.rest).toEqual({ n: 1, of: 4 })
    expect(s.dose).toBeNull()
    expect(s.next?.change.kind).toBe('end')
  })

  it('has no week before the start nor after the end', () => {
    const before = cycleSummary(CJC, [vial()], d('2026-09-14T10:00'))!
    expect(before.week).toBeNull()
    expect(before.dose).toBeNull()
    expect(before.next?.dose?.units).toBe(6)
    const after = cycleSummary(CJC, [vial()], d('2027-03-01T10:00'))!
    expect(after.info.phase).toBe('finished')
    expect(after.week).toBeNull()
    expect(after.next).toBeNull()
  })

  it('leaves the total open for a plan that ends in maintenance', () => {
    const reta: ProtocolLike = {
      compoundId: 'retatrutide',
      startDate: '2026-09-07',
      times: ['09:00'],
      steps: [
        { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
        { doseMg: 2.5, intervalDays: 1, weekdays: [1], durationWeeks: null },
      ],
    }
    const s = cycleSummary(reta, [], d('2026-10-05T10:00'))!
    expect(s.week).toEqual({ n: 5, of: null })
    expect(s.next).toBeNull()
  })

  it('returns null for a protocol without steps', () => {
    expect(cycleSummary({ ...CJC, steps: [] }, [], d('2026-10-05T10:00'))).toBeNull()
  })
})

describe('reading a dose', () => {
  it('writes units and mass the way the app does', () => {
    const v = doseView(CJC, 0.2, [vial()])
    expect(fmtDoseView(v, 'es')).toEqual({ units: '12 U', mass: '200 + 200 mcg' })
    expect(fmtDoseLine(v, 'es')).toBe('12 U (200 + 200 mcg)')
    expect(fmtDoseLine(doseView(CJC, 0.2, []), 'en')).toBe('200 + 200 mcg')
  })
})
