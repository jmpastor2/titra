import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import type { ProtocolLike } from '@/domain/types'
import { administrationOf, describeDoses, unitsFor } from './units'

const BLEND: Pick<ProtocolLike, 'steps' | 'components'> = {
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null },
  ],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}

const vial = (over: Partial<InventoryRow>): InventoryRow => ({
  id: 'v',
  patient_id: 'p',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'blend',
  total_mg: 5,
  remaining_mg: 5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: null,
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '',
  updated_at: '',
  ...over,
})

describe('administrationOf', () => {
  it('adds the partners at the dose of the step, in proportion to the primary', () => {
    expect(administrationOf(BLEND, 'mod-grf-1-29', 0.15)).toEqual([
      { compoundId: 'mod-grf-1-29', doseMg: 0.15 },
      { compoundId: 'ipamorelin', doseMg: expect.closeTo(0.15, 10) },
    ])
  })
  it('is just the dose for a single compound or without a protocol', () => {
    expect(administrationOf(null, 'mots-c', 1)).toEqual([{ compoundId: 'mots-c', doseMg: 1 }])
    expect(administrationOf({ steps: BLEND.steps, components: [] }, 'mots-c', 1)).toHaveLength(1)
  })
})

describe('describeDoses', () => {
  it('reads each compound in the unit it is dosed in', () => {
    expect(
      describeDoses(
        [
          { compoundId: 'mod-grf-1-29', doseMg: 0.15 },
          { compoundId: 'ipamorelin', doseMg: 0.15 },
        ],
        'es',
      ),
    ).toBe('150 + 150 mcg')
    expect(describeDoses([{ compoundId: 'retatrutide', doseMg: 1.5 }], 'es')).toBe('1,5 mg')
    expect(
      describeDoses(
        [
          { compoundId: 'retatrutide', doseMg: 2 },
          { compoundId: 'ipamorelin', doseMg: 0.1 },
        ],
        'en',
      ),
    ).toBe('2 + 0.1 mg')
  })
})

describe('unitsFor', () => {
  it('draws a blend as one load from its vial', () => {
    // 5 + 5 mg in 3 mL: 1.667 mg/mL of each; 150 mcg = 0.09 mL = 9 U.
    const doses = administrationOf(BLEND, 'mod-grf-1-29', 0.15)
    expect(unitsFor(doses, [vial({})])).toBe(9)
  })
  it('is unknown while the vial is not reconstituted or missing', () => {
    const doses = administrationOf(BLEND, 'mod-grf-1-29', 0.15)
    expect(unitsFor(doses, [vial({ concentration_mg_per_ml: null, diluent_ml: null })])).toBeNull()
    expect(unitsFor(doses, [])).toBeNull()
  })
})
