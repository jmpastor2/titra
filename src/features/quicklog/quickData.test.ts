import { describe, expect, it } from 'vitest'
import type { MeasurementKind, MeasurementRow } from '@/data/database.types'
import { deriveQuickData } from './quickData'

let n = 0
const row = (kind: MeasurementKind, value: number, at: string, unit = 'x'): MeasurementRow => ({
  id: `m${++n}`,
  patient_id: 'u',
  measured_at: new Date(at).toISOString(),
  kind,
  value,
  unit,
  notes: null,
  source: 'manual',
  created_at: '',
})

const NOW = new Date('2026-10-05T14:30')
const profile = { unit_system: 'metric' as const, protein_g_per_kg: 1.6, goal_weight_kg: 72 }

describe('deriveQuickData', () => {
  const rows = [
    row('weight', 77.4, '2026-10-01T08:00', 'kg'),
    row('weight', 77.0, '2026-10-03T08:00', 'kg'),
    row('waist', 91, '2026-09-25T08:00', 'cm'),
    row('hydration_ml', 250, '2026-10-05T08:10', 'ml'),
    row('hydration_ml', 500, '2026-10-05T11:40', 'ml'),
    row('hydration_ml', 250, '2026-10-04T20:00', 'ml'),
    row('protein_g', 30, '2026-10-05T09:00', 'g'),
    row('protein_g', 25, '2026-10-05T13:00', 'g'),
    row('resistance_session', 45, '2026-10-04T19:00', 'min'),
    row('energy', 7, '2026-10-05T09:00', 'score'),
  ]

  it('collects the day, the body and the week for the tiles', () => {
    const d = deriveQuickData(rows, profile, NOW)
    expect(d.weight).toMatchObject({ value: 77, previous: { value: 77.4 } })
    expect(d.weightSpark).toEqual([77.4, 77])
    expect(d.waist?.value).toBe(91)
    expect(d.water.total).toBe(750)
    expect(d.water.entries.map((r) => r.value)).toEqual([500, 250])
    expect(d.protein.total).toBe(55)
    expect(d.strength.count).toBe(1)
    expect(d.checkIn.doneToday).toBe(true)
    expect(d.imperial).toBe(false)
  })

  it('sets the protein target from the latest weight and the profile', () => {
    expect(deriveQuickData(rows, profile, NOW).protein.target).toBe(123)
    const heavy = { ...profile, protein_g_per_kg: 2 }
    expect(deriveQuickData(rows, heavy, NOW).protein.target).toBe(154)
  })

  it('uses the goal weight before the first weigh-in, and no target without either', () => {
    expect(deriveQuickData([], profile, NOW).protein.target).toBe(115)
    expect(deriveQuickData([], { ...profile, goal_weight_kg: null }, NOW).protein.target).toBeNull()
  })

  it('degrades to empty tiles on a brand-new account', () => {
    const d = deriveQuickData([], null, NOW)
    expect(d.weight).toBeNull()
    expect(d.weightSpark).toEqual([])
    expect(d.water).toEqual({ entries: [], total: 0 })
    expect(d.strength.count).toBe(0)
    expect(d.checkIn).toMatchObject({ doneToday: false, streak: 0, ageDays: null })
    expect(d.protein.target).toBeNull()
  })

  it('knows imperial users', () => {
    expect(deriveQuickData([], { ...profile, unit_system: 'imperial' }, NOW).imperial).toBe(true)
  })
})
