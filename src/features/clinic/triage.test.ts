import { describe, expect, it } from 'vitest'
import type {
  DoseRow,
  MeasurementRow,
  ProfileRow,
  ProtocolRow,
  SymptomRow,
} from '@/data/database.types'
import { summarisePatients } from './triage'

const NOW = new Date('2026-03-01T10:00:00')

const profile = (id: string, name: string): ProfileRow => ({
  id,
  role: 'patient',
  display_name: name,
  locale: 'es',
  unit_system: 'metric',
  clinic_code: null,
  birth_year: 1985,
  sex: 'M',
  height_cm: 180,
  goal_weight_kg: 85,
  protein_g_per_kg: 1.6,
  onboarded: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

const protocol = (patientId: string): ProtocolRow => ({
  id: `p-${patientId}`,
  patient_id: patientId,
  created_by: patientId,
  compound_id: 'semaglutide',
  name: 'Wegovy',
  route: 'sc',
  unit: 'mg',
  start_date: '2026-01-05',
  time_of_day: '08:00',
  times: ['08:00'],
  components: [],
  steps: [
    { doseMg: 0.25, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 0.5, intervalDays: 7, durationWeeks: null },
  ],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '2026-01-05T00:00:00Z',
  updated_at: '2026-01-05T00:00:00Z',
})

const dose = (patientId: string, iso: string): DoseRow => ({
  id: `d-${patientId}-${iso}`,
  patient_id: patientId,
  protocol_id: `p-${patientId}`,
  compound_id: 'semaglutide',
  dose_mg: 0.5,
  administered_at: iso,
  site_id: 'abd_ul',
  inventory_id: null,
  batch_id: null,
  notes: null,
  created_at: iso,
})

const symptom = (patientId: string, severity: number): SymptomRow => ({
  id: `s-${patientId}`,
  patient_id: patientId,
  occurred_at: '2026-02-27T10:00:00',
  kind: 'nausea',
  severity,
  notes: null,
  created_at: '2026-02-27T10:00:00',
})

const weight = (patientId: string, iso: string, kg: number): MeasurementRow => ({
  id: `w-${patientId}-${iso}`,
  patient_id: patientId,
  measured_at: iso,
  kind: 'weight',
  value: kg,
  unit: 'kg',
  notes: null,
  source: 'manual',
  created_at: iso,
})

describe('summarisePatients', () => {
  it('flags a severe symptom above an overdue dose', () => {
    const a = profile('a', 'Ana')
    const b = profile('b', 'Bruno')
    const out = summarisePatients({
      patients: [a, b],
      protocols: [protocol('a'), protocol('b')],
      // Ana: dosed yesterday, but reported severity 9.
      // Bruno: last dose three weeks ago → overdue.
      doses: [dose('a', '2026-02-28T08:00:00'), dose('b', '2026-02-08T08:00:00')],
      symptoms: [symptom('a', 9)],
      weights: [],
      now: NOW,
    })
    expect(out[0]!.patient.id).toBe('a')
    expect(out[0]!.flags).toContain('severe')
    expect(out[1]!.flags).toContain('overdue')
  })

  it('flags rapid weight loss above 1% per week', () => {
    const a = profile('a', 'Ana')
    const out = summarisePatients({
      patients: [a],
      protocols: [protocol('a')],
      doses: [dose('a', '2026-02-28T08:00:00')],
      symptoms: [],
      weights: [weight('a', '2026-02-01T08:00:00', 100), weight('a', '2026-03-01T08:00:00', 94)],
      now: NOW,
    })
    expect(out[0]!.flags).toContain('fastLoss')
    expect(out[0]!.weightDeltaKg).toBeCloseTo(-6)
  })

  it('flags patients with no recent data', () => {
    const a = profile('a', 'Ana')
    const out = summarisePatients({
      patients: [a],
      protocols: [],
      doses: [],
      symptoms: [],
      weights: [],
      now: NOW,
    })
    expect(out[0]!.flags).toContain('noData')
    expect(out[0]!.lastDoseAt).toBeNull()
  })

  it('flags low adherence only when enough doses were expected', () => {
    const a = profile('a', 'Ana')
    const out = summarisePatients({
      patients: [a],
      protocols: [protocol('a')],
      // Only one dose in the last four weeks, four were expected.
      doses: [dose('a', '2026-02-28T08:00:00')],
      symptoms: [],
      weights: [],
      now: NOW,
    })
    expect(out[0]!.flags).toContain('lowAdherence')
    expect(out[0]!.adherenceRatio).toBeLessThan(0.7)
  })
})

describe('summarisePatients with several peptides', () => {
  it('flags an overdue second protocol even when the first is on time', () => {
    const a = profile('a', 'Ana')
    const weekly = protocol('a')
    const second: ProtocolRow = {
      ...protocol('a'),
      id: 'p-a-2',
      compound_id: 'tirzepatide',
      created_at: '2026-01-06T00:00:00Z',
    }
    const out = summarisePatients({
      patients: [a],
      protocols: [weekly, second],
      doses: [
        dose('a', '2026-02-28T08:00:00'),
        {
          ...dose('a', '2026-02-01T08:00:00'),
          id: 'tz',
          compound_id: 'tirzepatide',
          protocol_id: 'p-a-2',
        },
      ],
      symptoms: [],
      weights: [],
      now: NOW,
    })
    expect(out[0]!.flags).toContain('overdue')
    expect(out[0]!.protocol?.id).toBe('p-a-2')
  })
})
