/**
 * Shared fixtures for the tests of this folder: the CJC-1295 + ipamorelin night protocol,
 * its blend vial and dose rows, local times written as "2026-10-04T08:00".
 */
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'

export const USER = 'user-1'

/** Mon–Fri nights at "25:00" (01:00 of the next morning), 100 mcg of each. */
export const cjcProtocol: ProtocolRow = {
  id: 'cjc',
  patient_id: USER,
  created_by: USER,
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '2026-09-20T00:00:00.000Z',
  updated_at: '2026-09-20T00:00:00.000Z',
}

/** Retatrutide, weekly: a protocol with no stack, no blend and a long tolerance. */
export const retaProtocol: ProtocolRow = {
  ...cjcProtocol,
  id: 'reta',
  compound_id: 'retatrutide',
  name: 'Retatrutida',
  unit: 'mg',
  time_of_day: '09:00',
  times: ['09:00'],
  steps: [{ doseMg: 1, intervalDays: 7, durationWeeks: null }],
  components: [],
}

/** 5 + 5 mg in 3 mL: 100 mcg of each is 6 U in one draw. */
export const blendVial: InventoryRow = {
  id: 'vial-blend',
  patient_id: USER,
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC-1295 + Ipamorelina 10 mg',
  total_mg: 5,
  remaining_mg: 4.5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: '2026-09-21',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '2026-09-20T00:00:00.000Z',
  updated_at: '2026-09-20T00:00:00.000Z',
}

/** A second blend vial of a different strength, for changing the vial of a dose. */
export const otherBlendVial: InventoryRow = {
  ...blendVial,
  id: 'vial-blend-2',
  label: 'CJC-1295 + Ipamorelina 10 mg · reserva',
  remaining_mg: 5,
  diluent_ml: 2.5,
  concentration_mg_per_ml: 2,
}

export const retaVial: InventoryRow = {
  ...blendVial,
  id: 'vial-reta',
  compound_id: 'retatrutide',
  label: 'Retatrutida 15 mg',
  total_mg: 15,
  remaining_mg: 12,
  diluent_ml: 1.5,
  concentration_mg_per_ml: 10,
  components: [],
}

let seq = 0

export function doseRow(at: string, over: Partial<DoseRow> = {}): DoseRow {
  seq += 1
  return {
    id: `dose-${seq}`,
    patient_id: USER,
    protocol_id: 'cjc',
    compound_id: 'mod-grf-1-29',
    dose_mg: 0.1,
    administered_at: new Date(at).toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: null,
    planned_at: null,
    notes: null,
    created_at: new Date(at).toISOString(),
    ...over,
  }
}

/** One blend administration: the vial's own compound draws down the stock, the partner rides along. */
export function blendDose(at: string, over: Partial<DoseRow> = {}): DoseRow[] {
  const batch = `batch-${++seq}`
  const shared = { batch_id: batch, ...over }
  return [
    doseRow(at, { ...shared, inventory_id: blendVial.id }),
    doseRow(at, { ...shared, compound_id: 'ipamorelin', inventory_id: null }),
  ]
}
