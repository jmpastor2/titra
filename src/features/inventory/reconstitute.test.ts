import { describe, expect, it } from 'vitest'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import {
  contentMgOf,
  convertAmount,
  currentDoses,
  mlToAmount,
  parseAmount,
  plainAmount,
  reconstitutionPatch,
  reconstitutionPreview,
  waterIssues,
  waterShortcuts,
  waterToMl,
  type CurrentDose,
} from './reconstitute'

const mots: InventoryRow = {
  id: 'reserve',
  patient_id: 'u',
  compound_id: 'mots-c',
  form: 'vial',
  label: 'MOTS-c 10 mg · reserva',
  total_mg: 10,
  remaining_mg: 10,
  concentration_mg_per_ml: null,
  diluent_ml: null,
  components: [],
  opened_at: null,
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '',
  updated_at: '',
}

const cjcBlend: InventoryRow = {
  ...mots,
  id: 'blend',
  compound_id: 'mod-grf-1-29',
  label: 'CJC-1295 + Ipamorelina 10 mg',
  total_mg: 5,
  remaining_mg: 5,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
}

const protocol = (over: Partial<ProtocolRow>): ProtocolRow => ({
  id: 'p-mots',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mots-c',
  name: 'MOTS-c',
  route: 'sc',
  unit: 'mg',
  start_date: '2026-09-14',
  time_of_day: '09:00',
  times: ['09:00'],
  steps: [
    { doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: 4 },
    { doseMg: 1.2, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null },
  ],
  components: [],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
  ...over,
})

const motsDose = (doseMg: number): CurrentDose => ({
  protocolId: 'p-mots',
  protocolName: 'MOTS-c',
  compoundId: 'mots-c',
  doseMg,
})

describe('water amounts', () => {
  it('is 100 U = 1 mL: units divide by a hundred, mL stay as they are', () => {
    expect(waterToMl(100, 'U')).toBe(1)
    expect(waterToMl(150, 'U')).toBe(1.5)
    expect(waterToMl(2, 'mL')).toBe(2)
    expect(mlToAmount(1, 'U')).toBe(100)
    expect(mlToAmount(0.25, 'U')).toBe(25)
    expect(mlToAmount(3, 'mL')).toBe(3)
  })

  it('reads a decimal comma and rejects what is not a number', () => {
    expect(parseAmount('1,5')).toBe(1.5)
    expect(parseAmount(' 100 ')).toBe(100)
    expect(parseAmount('')).toBeNaN()
    expect(parseAmount('abc')).toBeNaN()
    expect(parseAmount('1.2.3')).toBeNaN()
  })

  it('converts the field when the unit is switched, keeping the same water', () => {
    expect(convertAmount('100', 'U', 'mL')).toBe('1')
    expect(convertAmount('1,5', 'mL', 'U')).toBe('150')
    expect(convertAmount('25', 'U', 'mL')).toBe('0.25')
    // Nothing to convert yet: what is being typed is kept.
    expect(convertAmount('', 'U', 'mL')).toBe('')
    expect(convertAmount('abc', 'U', 'mL')).toBe('abc')
    expect(plainAmount(0.1 + 0.2)).toBe('0.3')
  })

  it('offers 1, 2 and 3 mL for peptide vials and larger amounts for hundreds of mg', () => {
    expect(waterShortcuts(10)).toEqual([1, 2, 3])
    expect(waterShortcuts(80)).toEqual([1, 2, 3])
    expect(waterShortcuts(500)).toEqual([2, 5, 10])
    // 1, 2 and 3 mL are 100, 200 and 300 U.
    expect(waterShortcuts(10).map((ml) => mlToAmount(ml, 'U'))).toEqual([100, 200, 300])
  })

  it('adds up every compound of a blend', () => {
    expect(contentMgOf(mots)).toBe(10)
    expect(contentMgOf(cjcBlend)).toBe(10)
  })
})

describe('reconstitution preview', () => {
  it('100 U of water in a 10 mg vial is 1 mL, 10 mg/mL and 0.1 mg per unit', () => {
    const p = reconstitutionPreview(mots, waterToMl(100, 'U'), [motsDose(1.2)])!
    expect(p.concentration).toBe(10)
    expect(p.compounds).toEqual([{ compoundId: 'mots-c', mg: 10, concMgPerMl: 10, mgPerUnit: 0.1 }])
    // The dose that went wrong on a real vial: 1.2 mg is 12 U.
    expect(p.draws).toEqual([
      {
        protocolId: 'p-mots',
        protocolName: 'MOTS-c',
        parts: [{ compoundId: 'mots-c', doseMg: 1.2 }],
        units: 12,
      },
    ])
  })

  it('shows what 100 typed as mL would have done: 0.1 mg/mL and a dose of 1200 U', () => {
    const wrong = reconstitutionPreview(mots, waterToMl(100, 'mL'), [motsDose(1.2)])!
    expect(wrong.concentration).toBeCloseTo(0.1, 10)
    expect(wrong.draws[0]!.units).toBe(1200)
    // And 12 U of that liquid would carry 0.012 mg, not 1.2 mg.
    expect(wrong.compounds[0]!.mgPerUnit * 12).toBeCloseTo(0.012, 10)
  })

  it('draws a premixed blend as one load, with each compound in the same liquid', () => {
    const blendDose = (compoundId: string): CurrentDose => ({
      protocolId: 'p-cjc',
      protocolName: 'CJC-1295 + Ipamorelina',
      compoundId,
      doseMg: 0.1,
    })
    const p = reconstitutionPreview(cjcBlend, 3, [
      blendDose('mod-grf-1-29'),
      blendDose('ipamorelin'),
    ])!
    expect(p.concentration).toBeCloseTo(5 / 3, 10)
    expect(p.compounds.map((c) => c.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
    for (const c of p.compounds) expect(c.mgPerUnit).toBeCloseTo(5 / 300, 10)
    // 0.1 mg of each is 6 U in total, once.
    expect(p.draws).toHaveLength(1)
    expect(p.draws[0]!.units).toBe(6)
    expect(p.draws[0]!.parts).toHaveLength(2)
  })

  it('ignores doses of compounds that are not in the vial', () => {
    const p = reconstitutionPreview(mots, 1, [
      { protocolId: 'x', protocolName: 'Reta', compoundId: 'retatrutide', doseMg: 2 },
    ])!
    expect(p.draws).toEqual([])
  })

  it('has no preview without usable water', () => {
    expect(reconstitutionPreview(mots, 0, [])).toBeNull()
    expect(reconstitutionPreview(mots, Number.NaN, [])).toBeNull()
    expect(reconstitutionPreview(mots, -1, [])).toBeNull()
  })

  it('saves only the water, the concentration and the date', () => {
    expect(reconstitutionPatch(mots, 1, '2026-10-05')).toEqual({
      diluent_ml: 1,
      concentration_mg_per_ml: 10,
      opened_at: '2026-10-05',
    })
    expect(reconstitutionPatch(mots, 0.1 + 0.2, '2026-10-05')!.diluent_ml).toBe(0.3)
    expect(reconstitutionPatch(mots, 0, '2026-10-05')).toBeNull()
    // The concentration follows the water as saved, not the float it was typed as.
    expect(reconstitutionPatch(mots, 0.33333, '2026-10-05')).toEqual({
      diluent_ml: 0.333,
      concentration_mg_per_ml: 10 / 0.333,
      opened_at: '2026-10-05',
    })
    expect(reconstitutionPatch(mots, 0.0001, '2026-10-05')).toBeNull()
  })
})

describe('water guard', () => {
  const check = (amount: number, unit: 'U' | 'mL', over = {}) =>
    waterIssues({ amount, unit, contentMg: 10, draws: [], ...over })

  it('accepts 100 U for a 10 mg vial and says nothing', () => {
    expect(check(100, 'U')).toEqual([])
    expect(check(1, 'mL')).toEqual([])
    expect(check(2.5, 'mL')).toEqual([])
    expect(check(300, 'U')).toEqual([])
  })

  it('catches the trap: 100 in the mL field is probably 100 units', () => {
    expect(check(100, 'mL')).toEqual([{ kind: 'unitsAsMl', amount: 100, ml: 1, contentMg: 10 }])
    expect(check(20, 'mL')[0]).toMatchObject({ kind: 'unitsAsMl', ml: 0.2 })
  })

  it('asks the same for a large vial: 300 mL on an 80 mg blend is probably 300 U = 3 mL', () => {
    expect(waterIssues({ amount: 300, unit: 'mL', contentMg: 80, draws: [] })).toEqual([
      { kind: 'unitsAsMl', amount: 300, ml: 3, contentMg: 80 },
    ])
    expect(waterIssues({ amount: 500, unit: 'mL', contentMg: 500, draws: [] })[0]).toMatchObject({
      kind: 'unitsAsMl',
      ml: 5,
    })
  })

  it('only suggests units when that reading is itself a sensible amount of water', () => {
    // 5000 mL would be 50 mL read as units: still too much, so just say so.
    expect(check(5000, 'mL')).toEqual([
      { kind: 'tooMuch', ml: 5000, contentMg: 10, concMgPerMl: 10 / 5000 },
    ])
    // Between 10 and 20 mL is too much, but not obviously units.
    expect(check(19, 'mL')[0]).toMatchObject({ kind: 'tooMuch' })
  })

  it('warns about more than 10 mL, in either unit', () => {
    expect(check(15, 'mL')).toEqual([
      { kind: 'tooMuch', ml: 15, contentMg: 10, concMgPerMl: 10 / 15 },
    ])
    expect(check(1500, 'U')[0]).toMatchObject({ kind: 'tooMuch', ml: 15 })
    expect(check(10, 'mL')).toEqual([])
  })

  it('catches the opposite slip: 2 in the units field is probably 2 mL', () => {
    expect(check(2, 'U')).toEqual([{ kind: 'mlAsUnits', amount: 2 }])
    expect(check(9, 'U')[0]).toMatchObject({ kind: 'mlAsUnits' })
    expect(check(10, 'U')).toEqual([])
  })

  it('is silent until there is an amount', () => {
    expect(check(Number.NaN, 'U')).toEqual([])
    expect(check(0, 'mL')).toEqual([])
    expect(check(-5, 'U')).toEqual([])
  })

  it('warns when the dose would be under 2 U or over 100 U per draw', () => {
    const draws = (units: number) => [{ units, parts: [{ compoundId: 'mots-c', doseMg: 1.2 }] }]
    expect(check(100, 'U', { draws: draws(12) })).toEqual([])
    expect(check(100, 'U', { draws: draws(1.5) })).toEqual([
      { kind: 'doseTooSmall', units: 1.5, compoundIds: ['mots-c'] },
    ])
    expect(check(100, 'U', { draws: draws(2) })).toEqual([])
    expect(check(100, 'U', { draws: draws(100) })).toEqual([])
    expect(check(100, 'U', { draws: draws(120) })).toEqual([
      { kind: 'doseTooBig', units: 120, compoundIds: ['mots-c'] },
    ])
  })

  it('also says when a dose does not fit the syringe the person injects with', () => {
    const draws = [{ units: 45, parts: [{ compoundId: 'mots-c', doseMg: 4.5 }] }]
    expect(check(100, 'U', { draws, barrel: 100 })).toEqual([])
    expect(check(100, 'U', { draws, barrel: 30 })).toEqual([
      { kind: 'overBarrel', units: 45, capacity: 30, compoundIds: ['mots-c'] },
    ])
  })

  it('names the water first and leaves the doses it distorts for after the fix', () => {
    // The real mistake, end to end: 100 mL makes a 1.2 mg dose a 1200 U draw.
    const preview = reconstitutionPreview(mots, waterToMl(100, 'mL'), [motsDose(1.2)])!
    expect(preview.draws[0]!.units).toBe(1200)
    const issues = (amount: number, unit: 'U' | 'mL') =>
      waterIssues({ amount, unit, contentMg: 10, draws: preview.draws }).map((i) => i.kind)
    expect(issues(100, 'mL')).toEqual(['unitsAsMl'])
    // Once the water is right, a dose that still does not fit is said.
    expect(issues(100, 'U')).toEqual(['doseTooBig'])
  })

  it('says a dose problem once when two protocols give the same dose', () => {
    const same = { units: 1.5, parts: [{ compoundId: 'mots-c', doseMg: 1.2 }] }
    expect(check(100, 'U', { draws: [same, same] })).toHaveLength(1)
  })
})

describe('current doses', () => {
  const now = new Date('2026-10-05T10:00')

  it('takes the dose of the step the protocol is on', () => {
    // Started 14 Sep: four weeks at 1 mg, then 1.2 mg. On 5 Oct it is week 3: 1 mg.
    expect(currentDoses([protocol({})], ['mots-c'], now)).toEqual([
      { protocolId: 'p-mots', protocolName: 'MOTS-c', compoundId: 'mots-c', doseMg: 1 },
    ])
    // Four weeks on, the next step.
    expect(currentDoses([protocol({})], ['mots-c'], new Date('2026-10-15T10:00'))[0]!.doseMg).toBe(
      1.2,
    )
  })

  it('uses the first step before the protocol starts and the last one after it ends', () => {
    expect(currentDoses([protocol({ start_date: '2026-10-20' })], ['mots-c'], now)[0]!.doseMg).toBe(
      1,
    )
    const finite = protocol({
      steps: [{ doseMg: 2, intervalDays: 1, weekdays: [1], durationWeeks: 2 }],
    })
    expect(currentDoses([finite], ['mots-c'], new Date('2026-12-01T10:00'))[0]!.doseMg).toBe(2)
  })

  it('gives each compound of a stack its own share, following the titration', () => {
    const cjc = protocol({
      id: 'p-cjc',
      compound_id: 'mod-grf-1-29',
      name: 'CJC-1295 + Ipamorelina',
      steps: [
        { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
        { doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null },
      ],
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
      start_date: '2026-09-28',
    })
    const doses = currentDoses([cjc], ['mod-grf-1-29', 'ipamorelin'], now)
    expect(doses.map((d) => [d.compoundId, d.doseMg])).toEqual([
      ['mod-grf-1-29', 0.2],
      ['ipamorelin', 0.2],
    ])
  })

  it('skips paused, inactive and unrelated protocols', () => {
    const rest = protocol({
      steps: [{ doseMg: 0, intervalDays: 1, pause: true, durationWeeks: null }],
    })
    expect(currentDoses([rest], ['mots-c'], now)).toEqual([])
    expect(currentDoses([protocol({ status: 'paused' })], ['mots-c'], now)).toEqual([])
    expect(currentDoses([protocol({})], ['retatrutide'], now)).toEqual([])
  })
})
