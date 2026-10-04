import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import type { ProtocolLike } from '@/domain/types'
import { doseDetail, doseInline, doseMain, doseShift, stepDose } from './dose'

// Premixed CJC-1295 + ipamorelin: 5 + 5 mg in 3 mL, so 1 U = 16.7 mcg of each.
const BLEND: InventoryRow = {
  id: 'v-blend',
  patient_id: 'u',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC + Ipa',
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
}
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, durationWeeks: null }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}

describe('stepDose', () => {
  it('turns a dose into the units of the blend draw', () => {
    expect(stepDose(CJC, [BLEND], 0.1)).toEqual({ mg: 0.1, units: 6 })
    expect(stepDose(CJC, [BLEND], 0.15)).toEqual({ mg: 0.15, units: 9 })
    expect(stepDose(CJC, [BLEND], 0.2)).toEqual({ mg: 0.2, units: 12 })
  })

  it('has no units without a vial that says how to draw it', () => {
    expect(stepDose(CJC, [], 0.15)).toEqual({ mg: 0.15, units: null })
    expect(
      stepDose(CJC, [{ ...BLEND, concentration_mg_per_ml: null, diluent_ml: null }], 0.15),
    ).toEqual({
      mg: 0.15,
      units: null,
    })
  })

  it('has no draw for a pause', () => {
    expect(stepDose(CJC, [BLEND], 0).units).toBeNull()
  })
})

describe('dose text', () => {
  const known = { mg: 0.15, units: 9 }
  const unknown = { mg: 1.5, units: null }

  it('leads with the units and keeps the dose beside them', () => {
    expect(doseMain(known, 'mcg', 'es')).toBe('9 U')
    expect(doseDetail(known, 'mcg', 'es')).toBe('150 mcg')
    expect(doseInline(known, 'mcg', 'es')).toBe('9 U (150 mcg)')
  })

  it('falls back to the dose itself and formats numbers for the language', () => {
    expect(doseMain(unknown, 'mg', 'es')).toBe('1,5 mg')
    expect(doseMain(unknown, 'mg', 'en')).toBe('1.5 mg')
    expect(doseDetail(unknown, 'mg', 'es')).toBeNull()
    expect(doseInline({ mg: 1.75, units: 17.5 }, 'mg', 'es')).toBe('17,5 U (1,75 mg)')
  })

  it('shows the shift in the substance unit only when units are the main figure', () => {
    expect(doseShift(known, { mg: 0.2, units: 12 }, 'mcg', 'es')).toBe('150 → 200 mcg')
    expect(doseShift(unknown, { mg: 1.75, units: null }, 'mg', 'es')).toBeNull()
  })
})
