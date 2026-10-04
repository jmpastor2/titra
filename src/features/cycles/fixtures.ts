/**
 * Rows and plans shared by the tests of the Ciclos screen: the three regimens of the
 * account this app is built for (a CJC-1295 + ipamorelina blend with a rest, a weekly
 * titration that ends in maintenance, MOTS-c with a step up). Tests only.
 */
import type {
  DoseRow,
  InventoryRow,
  Json,
  MeasurementRow,
  ProtocolRow,
} from '@/data/database.types'
import type { ScheduleStep } from '@/domain/types'

export const USER = 'user-1'

const W15 = [1, 2, 3, 4, 5]

/** 100 → 150 → 200 mcg of each peptide, then four weeks of rest: 12 dosing weeks. */
export const CJC_STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4, label: 'Descanso' },
]

/** Weekly Monday titration to a 2.5 mg maintenance that never ends. */
export const RETA_STEPS: ScheduleStep[] = [
  { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
  { doseMg: 1.25, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
  { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
  { doseMg: 1.75, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
  { doseMg: 2.5, intervalDays: 1, weekdays: [1], durationWeeks: null },
]

/** MOTS-c Mon/Wed/Fri: 1 mg for four weeks, then 1.5 mg with no end. */
export const MOTS_STEPS: ScheduleStep[] = [
  { doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: 4 },
  { doseMg: 1.5, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null },
]

/** Four Mondays at 1 mg: easy to take, miss and count. */
export const FOUR_MONDAYS: ScheduleStep[] = [
  { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 4 },
]

const STAMP = '2026-09-01T10:00:00.000Z'

/** Steps as the database column holds them. */
export const asJson = (steps: readonly ScheduleStep[]): Json => steps as unknown as Json

type Over = Partial<ProtocolRow> & Pick<ProtocolRow, 'id'>

export function protocolRow(over: Over): ProtocolRow {
  return {
    patient_id: USER,
    created_by: USER,
    compound_id: 'mod-grf-1-29',
    name: 'CJC-1295 + Ipamorelina',
    route: 'sc',
    unit: 'mcg',
    start_date: '2026-09-21',
    time_of_day: '01:00',
    times: ['25:00'],
    steps: asJson(CJC_STEPS),
    components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    status: 'active',
    template_id: null,
    notes: 'En ayunas',
    created_at: STAMP,
    updated_at: STAMP,
    ...over,
  }
}

export const cjc = (over: Partial<ProtocolRow> = {}) => protocolRow({ id: 'cjc', ...over })

export const reta = (over: Partial<ProtocolRow> = {}) =>
  protocolRow({
    id: 'reta',
    compound_id: 'retatrutide',
    name: 'Retatrutida',
    unit: 'mg',
    start_date: '2026-09-14',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: asJson(RETA_STEPS),
    components: [],
    notes: null,
    ...over,
  })

export const mots = (over: Partial<ProtocolRow> = {}) =>
  protocolRow({
    id: 'mots',
    compound_id: 'mots-c',
    name: 'MOTS-c',
    unit: 'mg',
    start_date: '2026-09-14',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: asJson(MOTS_STEPS),
    components: [],
    notes: null,
    ...over,
  })

/** A dose of the protocol's primary compound taken at `iso` (local time). */
export function doseRow(iso: string, over: Partial<DoseRow> = {}): DoseRow {
  const at = new Date(iso)
  return {
    id: `dose-${iso}`,
    patient_id: USER,
    protocol_id: null,
    compound_id: 'retatrutide',
    dose_mg: 1,
    administered_at: at.toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: null,
    planned_at: null,
    notes: null,
    created_at: at.toISOString(),
    ...over,
  }
}

export function weightRow(iso: string, kg: number): MeasurementRow {
  const at = new Date(iso)
  return {
    id: `weight-${iso}`,
    patient_id: USER,
    measured_at: at.toISOString(),
    kind: 'weight',
    value: kg,
    unit: 'kg',
    notes: null,
    source: 'manual',
    created_at: at.toISOString(),
  }
}

/** The premixed vial: 5 mg of each peptide in 3 mL, so 0.1 mg of each is 6 U. */
export const CJC_VIAL: InventoryRow = {
  id: 'vial-cjc',
  patient_id: USER,
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC-1295 + Ipamorelina',
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
  created_at: STAMP,
  updated_at: STAMP,
}

/** Retatrutide at 10 mg/mL: 1 mg is 10 U. */
export const RETA_VIAL: InventoryRow = {
  id: 'vial-reta',
  patient_id: USER,
  compound_id: 'retatrutide',
  form: 'vial',
  label: 'Retatrutida 15 mg',
  total_mg: 15,
  remaining_mg: 15,
  concentration_mg_per_ml: 10,
  diluent_ml: 1.5,
  components: [],
  opened_at: '2026-09-14',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: STAMP,
  updated_at: STAMP,
}
