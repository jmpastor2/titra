import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import {
  activeVial,
  concentrationFor,
  concentrationOf,
  drawPartFor,
  fillOf,
  isLyophilised,
  latestVialOf,
  unopenedCopy,
  needsReconstitution,
  remainingOf,
  restockPlan,
  vialLook,
  vialRunway,
  vialState,
  waterOf,
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
    created_at: '2026-09-21T10:00:00Z',
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

describe('the vial a dose comes from', () => {
  const mots = (over: Partial<InventoryRow>) =>
    vial({
      compound_id: 'mots-c',
      total_mg: 10,
      remaining_mg: 10,
      diluent_ml: 1,
      concentration_mg_per_ml: 10,
      components: [],
      ...over,
    })
  const old = mots({ id: 'old', remaining_mg: 0.3, opened_at: '2026-09-10' })
  const fresh = mots({ id: 'fresh', opened_at: '2026-09-28' })
  const reserve = mots({
    id: 'reserve',
    diluent_ml: null,
    concentration_mg_per_ml: null,
    opened_at: null,
  })

  it('keeps the oldest reconstituted vial first, and reconstituted before powder', () => {
    expect(activeVial([fresh, old], 'mots-c')?.id).toBe('old')
    expect(activeVial([reserve, fresh], 'mots-c')?.id).toBe('fresh')
    expect(activeVial([reserve], 'mots-c')?.id).toBe('reserve')
    expect(
      activeVial([mots({ archived: true }), mots({ id: 'e', remaining_mg: 0 })], 'mots-c'),
    ).toBe(undefined)
  })

  it('passes over a vial that cannot cover the dose for another one that can', () => {
    // 1.2 mg wanted: the old vial has 0.3 mg, the fresh one 10.
    expect(activeVial([old, fresh], 'mots-c', 1.2)?.id).toBe('fresh')
    // The two-argument form is unchanged.
    expect(activeVial([old, fresh], 'mots-c')?.id).toBe('old')
    // It still covers a smaller dose.
    expect(activeVial([old, fresh], 'mots-c', 0.3)?.id).toBe('old')
  })

  it('keeps the preferred vial when nothing else can take the dose', () => {
    expect(activeVial([old], 'mots-c', 1.2)?.id).toBe('old')
    // Powder cannot be drawn from, so it never takes over.
    expect(activeVial([old, reserve], 'mots-c', 1.2)?.id).toBe('old')
  })

  it('looks at the share of the compound that is in a blend vial', () => {
    // CJC 5 mg + ipamorelin 5 mg: what is left of one is left of the other, in proportion.
    const nearly = vial({ id: 'nearly', remaining_mg: 0.4, opened_at: '2026-09-01' })
    const full = vial({ id: 'full', remaining_mg: 5, opened_at: '2026-09-15' })
    expect(activeVial([nearly, full], 'ipamorelin', 0.5)?.id).toBe('full')
    expect(activeVial([nearly, full], 'ipamorelin', 0.3)?.id).toBe('nearly')
  })

  it('draws a dose from the vial that can cover it', () => {
    const part = drawPartFor([old, fresh], 'mots-c', 1.2)
    expect(part.concMgPerMl).toBe(10)
    // An explicit vial still wins.
    const other = mots({ id: 'other', concentration_mg_per_ml: 5, diluent_ml: 2 })
    expect(drawPartFor([old, fresh], 'mots-c', 1.2, other).concMgPerMl).toBe(5)
  })
})

describe('vial state', () => {
  const base = vial({ components: [], concentration_mg_per_ml: 10, diluent_ml: 1 })

  it('tells in use from reserve from finished', () => {
    expect(vialState(base)).toBe('inUse')
    expect(vialState(vial({ diluent_ml: null, concentration_mg_per_ml: null }))).toBe('reserve')
    expect(vialState(vial({ remaining_mg: 0 }))).toBe('finished')
    expect(vialState({ ...base, archived: true })).toBe('finished')
  })

  it('knows powder has no concentration', () => {
    expect(isLyophilised(vial({ diluent_ml: null, concentration_mg_per_ml: null }))).toBe(true)
    expect(isLyophilised(base)).toBe(false)
    expect(concentrationOf(base)).toBe(10)
  })

  it('draws powder as powder and liquid with its level', () => {
    expect(vialLook(vial({ diluent_ml: null, concentration_mg_per_ml: null })).state).toBe('powder')
    expect(vialLook(base).state).toBe('liquid')
    expect(vialLook(base).colors).toBeUndefined()
    // A blend is striped with each of its compounds.
    expect(vialLook(vial({ diluent_ml: 3 })).colors).toHaveLength(2)
  })
})

describe('adding another one', () => {
  const used = vial({
    id: 'used',
    patient_id: 'p1',
    compound_id: 'ghk-cu',
    label: 'KLOW 80 mg',
    total_mg: 50,
    remaining_mg: 12,
    concentration_mg_per_ml: 16.6667,
    diluent_ml: 3,
    components: [
      { compoundId: 'bpc-157', mg: 10 },
      { compoundId: 'tb-500', mg: 10 },
      { compoundId: 'kpv', mg: 10 },
    ],
    opened_at: '2026-09-21',
    expires_at: '2027-03-01',
    lot: 'A12',
    storage_notes: 'nevera',
  })

  it('copies what makes it the same product and leaves it as powder without dates', () => {
    const copy = unopenedCopy(used)
    expect(copy).toMatchObject({
      patient_id: 'p1',
      compound_id: 'ghk-cu',
      form: 'vial',
      label: 'KLOW 80 mg',
      total_mg: 50,
      remaining_mg: 50,
      components: used.components,
      concentration_mg_per_ml: null,
      diluent_ml: null,
      opened_at: null,
      expires_at: null,
      lot: null,
    })
    expect(copy).not.toHaveProperty('id')
    // The new row reads as powder in every respect.
    expect(vialState({ ...(copy as InventoryRow) })).toBe('reserve')
  })

  it('finds the newest vial of a compound as the template, archived ones included', () => {
    const older = vial({ id: 'a', compound_id: 'mots-c', created_at: '2026-08-01T00:00:00Z' })
    const newer = vial({
      id: 'b',
      compound_id: 'mots-c',
      created_at: '2026-09-01T00:00:00Z',
      archived: true,
    })
    expect(latestVialOf([older, newer, used], 'mots-c')?.id).toBe('b')
    expect(latestVialOf([used], 'mots-c')).toBeUndefined()
  })
})

describe('products that come ready to use', () => {
  const pen = vial({
    id: 'pen',
    form: 'pen',
    compound_id: 'retatrutide',
    total_mg: 12,
    remaining_mg: 12,
    concentration_mg_per_ml: null,
    diluent_ml: null,
    components: [],
    opened_at: null,
  })

  it('never need water, unlike a vial or cartridge of powder', () => {
    expect(needsReconstitution(pen)).toBe(false)
    expect(needsReconstitution({ ...pen, form: 'tablet' })).toBe(false)
    expect(needsReconstitution({ ...pen, form: 'vial' })).toBe(true)
    expect(needsReconstitution({ ...pen, form: 'cartridge' })).toBe(true)
    // Once it has water, it does not.
    expect(needsReconstitution({ ...pen, form: 'vial', diluent_ml: 1.5 })).toBe(false)
  })

  it('are in reserve until opened, then in use', () => {
    expect(vialState(pen)).toBe('reserve')
    expect(vialState({ ...pen, opened_at: '2026-09-20' })).toBe('inUse')
  })

  it('are drawn as liquid and left out of the vials to reconstitute', () => {
    expect(vialLook(pen).state).toBe('liquid')
    const upcoming = new Map([['retatrutide', [{ at: at(25), doseMg: 2 }]]])
    const [line] = restockPlan([pen, { ...pen, id: 'powder', form: 'vial' }], upcoming)
    expect(line!.reserve).toBe(1)
  })
})

describe('amounts of a vial', () => {
  it('knows how much of it is left, between 0 and 1', () => {
    expect(fillOf(vial({ total_mg: 10, remaining_mg: 2.5 }))).toBe(0.25)
    expect(fillOf(vial({ total_mg: 10, remaining_mg: 12 }))).toBe(1)
    expect(fillOf(vial({ total_mg: 10, remaining_mg: 0 }))).toBe(0)
    expect(fillOf(vial({ total_mg: 0, remaining_mg: 0 }))).toBe(0)
  })

  it('gives the water a vial got: as saved, or worked back from its concentration', () => {
    expect(waterOf(vial({ diluent_ml: 3, concentration_mg_per_ml: null }))).toBe(3)
    // Saved with a concentration but no water (older rows): 5 mg at 2.5 mg/mL is 2 mL.
    expect(waterOf(vial({ diluent_ml: null, concentration_mg_per_ml: 2.5 }))).toBe(2)
    expect(waterOf(vial({ diluent_ml: null, concentration_mg_per_ml: null }))).toBeNull()
  })
})
