import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import {
  activeVial,
  concentrationFor,
  drawPartFor,
  remainingOf,
  restockPlan,
  vialRunway,
} from './vials'

const at = (d: number) => new Date(2026, 8, d, 9)

describe('vialRunway', () => {
  it('counts the doses a vial covers and when it runs out, across a step up', () => {
    // 4 mg left; 2 mg this week, then the titration moves to 4 mg.
    const r = vialRunway(4, [
      { at: at(25), doseMg: 2 },
      { at: at(32), doseMg: 4 },
    ])
    expect(r.doses).toBe(1)
    expect(r.runsOutAt).toEqual(at(32))
    expect(r.nextDoseMg).toBe(2)
  })

  it('covers every dose when there is enough', () => {
    const r = vialRunway(
      0.5,
      [0, 1, 2, 3, 4].map((i) => ({ at: at(25 + i), doseMg: 0.1 })),
    )
    expect(r.doses).toBe(5)
    expect(r.runsOutAt).toBeNull()
  })

  it('handles an empty schedule', () => {
    expect(vialRunway(3, [])).toEqual({ doses: 0, runsOutAt: null, nextDoseMg: null })
  })
})

const vial = (over: Partial<InventoryRow>): InventoryRow =>
  ({
    id: 'v',
    patient_id: 'u',
    compound_id: 'mod-grf-1-29',
    form: 'vial',
    label: 'CJC/IPA',
    total_mg: 5,
    remaining_mg: 4.5,
    concentration_mg_per_ml: null,
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
  }) as InventoryRow

describe('blend vials', () => {
  it('gives each compound its own concentration and remaining amount', () => {
    const v = vial({})
    expect(concentrationFor(v, 'mod-grf-1-29')).toBeCloseTo(5 / 3, 6)
    expect(concentrationFor(v, 'ipamorelin')).toBeCloseTo(5 / 3, 6)
    expect(concentrationFor(v, 'bpc-157')).toBeNull()
    expect(remainingOf(v, 'ipamorelin')).toBeCloseTo(4.5, 6)
  })

  it('is the active vial for every compound it holds and draws as one blend', () => {
    const v = vial({})
    expect(activeVial([v], 'ipamorelin')?.id).toBe('v')
    expect(drawPartFor([v], 'ipamorelin', 0.1).blendKey).toBe('v')
    // KLOW: GHK-Cu 50 mg primary + KPV 10 mg in 2 mL → KPV 5 mg/mL.
    const klow = vial({
      compound_id: 'ghk-cu',
      total_mg: 50,
      remaining_mg: 50,
      diluent_ml: 2,
      components: [{ compoundId: 'kpv', mg: 10 }],
    })
    expect(concentrationFor(klow, 'kpv')).toBeCloseTo(5, 6)
  })

  it('adds reserve vials to the supply', () => {
    const open = vial({
      compound_id: 'mots-c',
      total_mg: 10,
      remaining_mg: 1,
      diluent_ml: 1,
      components: [],
    })
    const spare = vial({
      id: 's',
      compound_id: 'mots-c',
      total_mg: 10,
      remaining_mg: 10,
      diluent_ml: null,
      components: [],
    })
    const doses = Array.from({ length: 20 }, (_, i) => ({
      at: new Date(2026, 8, 28 + i * 2),
      doseMg: 1,
    }))
    const [line] = restockPlan([open, spare], new Map([['mots-c', doses]]))
    expect(line!.availableMg).toBe(11)
    expect(line!.reserve).toBe(1)
    expect(line!.runway.doses).toBe(11)
  })
})
