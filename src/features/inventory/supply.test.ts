import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import { supplyRunway } from './supply'

const vial = (over: Partial<InventoryRow>): InventoryRow =>
  ({
    id: 'v',
    patient_id: 'u',
    compound_id: 'retatrutide',
    form: 'vial',
    label: 'Reta',
    total_mg: 15,
    remaining_mg: 10.25,
    concentration_mg_per_ml: 10,
    diluent_ml: 1.5,
    components: [],
    opened_at: '2026-09-07',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '2026-09-07T10:00:00Z',
    updated_at: '',
    ...over,
  }) as InventoryRow

/** Weekly Monday 09:00 doses from Monday 5 October 2026, rising 0.25 mg a week. */
const weekly = (n: number, from = 1.75) =>
  Array.from({ length: n }, (_, i) => ({
    at: new Date(2026, 9, 5 + i * 7, 9),
    doseMg: from + 0.25 * i,
  }))

describe('supplyRunway', () => {
  it('stops at the discard date of the vial, not when the mg run out', () => {
    // Reconstituted on 7 Sep: the 28-day in-use period ends on Mon 5 Oct. The dose that day
    // is drawn; the next week the 8,5 mg still in it are thrown away and there is nothing else.
    const r = supplyRunway([vial({})], 'retatrutide', weekly(6))
    expect(r.doses).toBe(1)
    expect(r.runsOutAt).toEqual(new Date(2026, 9, 12, 9))
    expect(r.limitedBy).toBe('expiry')
    expect(r.wastedMg).toBeCloseTo(8.5, 6)
  })

  it('moves on to the reserve vial, whose in-use period starts on its first dose', () => {
    const spare = vial({
      id: 'spare',
      remaining_mg: 15,
      concentration_mg_per_ml: null,
      diluent_ml: null,
      opened_at: null,
      created_at: '2026-09-20T10:00:00Z',
    })
    // 12 Oct: open vial expired, spare starts (until 9 Nov). 2+2.25+2.5+2.75+3 = 12.5 mg by 9 Nov,
    // then 16 Nov is past its period: 2.5 mg wasted and the supply ends there.
    const r = supplyRunway([vial({}), spare], 'retatrutide', weekly(8))
    expect(r.doses).toBe(6)
    expect(r.runsOutAt).toEqual(new Date(2026, 10, 16, 9))
    expect(r.limitedBy).toBe('expiry')
  })

  it('draws one dose from two vials when the first has only part of it', () => {
    const a = vial({ id: 'a', remaining_mg: 1, opened_at: '2026-10-01' })
    const b = vial({ id: 'b', remaining_mg: 5, opened_at: '2026-10-02' })
    const r = supplyRunway([a, b], 'retatrutide', [
      { at: new Date(2026, 9, 5, 9), doseMg: 2 },
      { at: new Date(2026, 9, 12, 9), doseMg: 2 },
      { at: new Date(2026, 9, 19, 9), doseMg: 2 },
      { at: new Date(2026, 9, 26, 9), doseMg: 2 },
    ])
    expect(r.doses).toBe(3)
    expect(r.limitedBy).toBe('amount')
    expect(r.wastedMg).toBe(0)
  })

  it('lasts past the horizon when there is plenty and nothing expires', () => {
    const r = supplyRunway(
      [vial({ opened_at: '2026-10-04', remaining_mg: 15 })],
      'retatrutide',
      weekly(2),
    )
    expect(r).toMatchObject({ doses: 2, runsOutAt: null, limitedBy: null, wastedMg: 0 })
  })

  it('a label date earlier than the in-use period wins for a reserve vial', () => {
    const spare = vial({
      id: 'spare',
      remaining_mg: 15,
      concentration_mg_per_ml: null,
      diluent_ml: null,
      opened_at: null,
      expires_at: '2026-10-15',
    })
    const r = supplyRunway([spare], 'retatrutide', weekly(4))
    // 5 and 12 Oct drawn; 19 Oct is past the label date.
    expect(r.doses).toBe(2)
    expect(r.runsOutAt).toEqual(new Date(2026, 9, 19, 9))
  })

  it('ignores archived and empty vials', () => {
    const r = supplyRunway(
      [vial({ archived: true }), vial({ id: 'e', remaining_mg: 0 })],
      'retatrutide',
      weekly(1),
    )
    expect(r).toMatchObject({ doses: 0, limitedBy: 'amount' })
  })
})
