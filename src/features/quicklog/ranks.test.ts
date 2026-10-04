import { describe, expect, it } from 'vitest'
import type { DoseGlance } from './doseGlance'
import { deriveQuickData } from './quickData'
import { buildRanks } from './ranks'
import { rankTiles, type TileId } from './tiles'
import type { MeasurementKind, MeasurementRow } from '@/data/database.types'

const NOW = new Date('2026-10-05T14:30')
const profile = { unit_system: 'metric' as const, protein_g_per_kg: 1.6, goal_weight_kg: 72 }

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

const quiet: DoseGlance = {
  status: 'upcoming',
  dose: null,
  hoursAhead: 9,
  fastFor: null,
  fastingAvailable: true,
}

const tiers = (rows: MeasurementRow[], glance: DoseGlance, over: { goalMl?: number } = {}) =>
  Object.fromEntries(
    buildRanks({
      data: deriveQuickData(rows, profile, NOW),
      glance,
      goalMl: over.goalMl ?? 2500,
      now: NOW,
    }).map((r) => [r.id, r.tier]),
  ) as Partial<Record<TileId, number>>

describe('buildRanks', () => {
  it('reads a brand-new account: weigh in and check in first, no fasting tile', () => {
    const t = tiers([], { ...quiet, status: 'none', hoursAhead: null, fastingAvailable: false })
    expect(t).toMatchObject({ dose: 1, water: 1, weight: 2, checkin: 2, protein: 1, strength: 2 })
    expect(t.fasting).toBeUndefined()
  })

  it('reads a good morning: weighed, checked in, water on its way', () => {
    const rows = [
      row('weight', 77, '2026-10-05T08:00', 'kg'),
      row('energy', 7, '2026-10-05T09:00', 'score'),
      row('hydration_ml', 500, '2026-10-05T10:00', 'ml'),
    ]
    const t = tiers(rows, quiet)
    expect(t).toMatchObject({ weight: 0, checkin: 0, water: 1, fasting: 0, waist: 1 })
  })

  it('lifts the dose that is due and the fast that goes with it', () => {
    const due: DoseGlance = {
      ...quiet,
      status: 'due',
      hoursAhead: null,
      fastFor: { protocolId: 'p', at: NOW, compoundIds: [], name: 'CJC', units: null },
    }
    expect(tiers([], due)).toMatchObject({ dose: 3, fasting: 2 })
  })

  it('marks goals as done once they are reached', () => {
    const rows = [
      row('hydration_ml', 2500, '2026-10-05T10:00', 'ml'),
      row('resistance_session', 45, '2026-10-04T19:00', 'min'),
      row('resistance_session', 45, '2026-10-02T19:00', 'min'),
    ]
    expect(tiers(rows, quiet)).toMatchObject({ water: 0, strength: 0 })
  })

  it('asks for a stale weigh-in and a stale tape measure', () => {
    const rows = [
      row('weight', 77, '2026-10-01T08:00', 'kg'),
      row('waist', 91, '2026-09-20T08:00', 'cm'),
    ]
    expect(tiers(rows, quiet)).toMatchObject({ weight: 2, waist: 2 })
  })

  it('feeds the ranking: a quiet day shows seven tiles with the pressing ones first', () => {
    const rows = [row('weight', 77, '2026-10-01T08:00', 'kg')]
    const ranks = buildRanks({
      data: deriveQuickData(rows, profile, NOW),
      glance: quiet,
      goalMl: 2500,
      now: NOW,
    })
    const { shown, hidden } = rankTiles(ranks)
    expect(shown).toHaveLength(7)
    expect(shown.slice(0, 3)).toEqual(['weight', 'checkin', 'strength'])
    expect(hidden).toEqual(['waist', 'fasting'])
  })
})
