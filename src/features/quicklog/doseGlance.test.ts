import { describe, expect, it } from 'vitest'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { doseGlance } from './doseGlance'

const protocol = (over: Partial<ProtocolRow>): ProtocolRow => ({
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
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

const dose = (compound: string, iso: string, protocolId = 'cjc'): DoseRow => ({
  id: `${compound}-${iso}`,
  patient_id: 'u',
  protocol_id: protocolId,
  compound_id: compound,
  dose_mg: 0.1,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: 'b',
  planned_at: null,
  notes: null,
  created_at: '',
})

const CJC = protocol({})
const MORNING = protocol({
  id: 'mots',
  compound_id: 'mots-c',
  name: 'MOTS-c',
  unit: 'mg',
  times: ['08:00'],
  steps: [{ doseMg: 1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [],
})

// A reconstituted blend vial: 5 + 5 mg in 3 mL, so 100 + 100 mcg is 6 U (1 U = 0.01 mL).
const vial: InventoryRow = {
  id: 'v1',
  patient_id: 'u',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC + ipa',
  total_mg: 5,
  remaining_mg: 5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: '2026-03-01',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '',
  updated_at: '',
}

describe('doseGlance', () => {
  it('asks for the dose that is due and counts it as a fasting dose', () => {
    const g = doseGlance([CJC], [], [vial], new Date('2026-03-03T22:05'))
    expect(g.status).toBe('due')
    expect(g.dose).toMatchObject({ protocolId: 'cjc', name: 'CJC + Ipa' })
    expect(g.dose?.units).toBeCloseTo(6, 1)
    expect(g.fastFor?.protocolId).toBe('cjc')
    expect(g.fastingAvailable).toBe(true)
  })

  it('shows the dose coming up and when', () => {
    // A dose turns "due" two hours before its time.
    const g = doseGlance([CJC], [], [], new Date('2026-03-03T18:00'))
    expect(g.status).toBe('upcoming')
    expect(g.hoursAhead).toBeCloseTo(4, 1)
    expect(g.dose?.units).toBeNull()
    expect(g.fastFor).not.toBeNull()
  })

  it('does not ask for a fast before the window', () => {
    const g = doseGlance([CJC], [], [], new Date('2026-03-03T09:00'))
    expect(g.status).toBe('upcoming')
    expect(g.fastFor).toBeNull()
    expect(g.fastingAvailable).toBe(true)
  })

  it('is done once everything planned today is taken, and points at the next day', () => {
    const taken = [dose('mod-grf-1-29', '2026-03-03T22:05'), dose('ipamorelin', '2026-03-03T22:05')]
    const g = doseGlance([CJC], taken, [], new Date('2026-03-03T23:00'))
    expect(g.status).toBe('done')
    expect(g.dose?.at.getDate()).toBe(4)
    expect(g.hoursAhead).toBeGreaterThan(20)
  })

  it('says a quiet day is quiet and still points at the next dose', () => {
    // Saturday: nothing planned.
    const g = doseGlance([CJC], [], [], new Date('2026-03-07T12:00'))
    expect(g.status).toBe('none')
    expect(g.dose?.at.getDay()).toBe(1)
  })

  it('catches up a dose that was missed when nothing else is pending', () => {
    const g = doseGlance([MORNING], [], [], new Date('2026-03-03T23:50'))
    expect(g.status).toBe('missed')
    expect(g.dose?.protocolId).toBe('mots')
    expect(g.fastingAvailable).toBe(false)
  })

  it('degrades to a free dose on a brand-new account', () => {
    expect(doseGlance([], [], [], new Date('2026-03-03T12:00'))).toEqual({
      status: 'none',
      dose: null,
      hoursAhead: null,
      fastFor: null,
      fastingAvailable: false,
    })
  })

  it('ignores paused protocols', () => {
    const g = doseGlance([protocol({ status: 'paused' })], [], [], new Date('2026-03-03T22:05'))
    expect(g.status).toBe('none')
    expect(g.fastingAvailable).toBe(false)
  })
})
