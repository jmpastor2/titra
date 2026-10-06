import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import { vialMg, vialView } from './vialView'
import { vialRunway } from './vials'

const vial = (over: Partial<InventoryRow> = {}): InventoryRow =>
  ({
    id: 'v',
    patient_id: 'u',
    compound_id: 'mots-c',
    form: 'vial',
    label: 'MOTS-c 10 mg',
    total_mg: 10,
    remaining_mg: 4,
    concentration_mg_per_ml: 10,
    diluent_ml: 1,
    components: [],
    opened_at: '2026-09-25',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '',
    updated_at: '',
    ...over,
  }) as InventoryRow

const now = new Date('2026-10-05T10:00:00')
const daily = (n: number, doseMg = 1) =>
  Array.from({ length: n }, (_, i) => ({ at: new Date(2026, 9, 6 + i, 9), doseMg }))

describe('vial view', () => {
  it('leads with the doses left when the schedule will run the vial out', () => {
    const v = vialView(vial(), vialRunway(4, daily(20)), now)
    expect(v.hero).toEqual({ kind: 'doses', count: 4 })
    // The fifth administration, 10 Oct, is the first it cannot cover.
    expect(v.coverDays).toBe(5)
    expect(v.coverDate).toEqual(new Date(2026, 9, 10, 9))
  })

  it('leads with the mg when the vial covers everything planned, or nothing is planned', () => {
    expect(vialView(vial(), vialRunway(4, daily(3)), now).hero).toEqual({ kind: 'mg', mg: 4 })
    const none = vialView(vial(), undefined, now)
    expect(none.hero).toEqual({ kind: 'mg', mg: 4 })
    expect(none.coverDays).toBeNull()
  })

  it('shows powder as mg, with no expiry ring', () => {
    const v = vialView(
      vial({ remaining_mg: 10, concentration_mg_per_ml: null, diluent_ml: null, opened_at: null }),
      undefined,
      now,
    )
    expect(v.powder).toBe(true)
    expect(v.hero).toEqual({ kind: 'mg', mg: 10 })
    expect(v.expiry).toBeNull()
  })

  it('draws the expiry ring from the in-use period', () => {
    // Opened 25 Sep: the 28 days end on 23 Oct, 18 days from today, of the 28.
    const v = vialView(vial(), undefined, now)
    expect(v.expiry).toMatchObject({ days: 18, estimated: true, tone: 'ok' })
    expect(v.expiry?.left).toBeCloseTo(18 / 28)
    expect(v.expired).toBe(false)
  })

  it('turns the ring amber in the last week and rose once expired', () => {
    const week = vialView(vial({ opened_at: '2026-09-12' }), undefined, now)
    expect(week.expiry).toMatchObject({ days: 5, tone: 'warn' })
    const old = vialView(vial({ opened_at: '2026-08-01' }), undefined, now)
    expect(old.expiry).toMatchObject({ days: -37, left: 0, tone: 'danger' })
    expect(old.expired).toBe(true)
  })

  it('uses a label date when it comes first, and does not call it an estimate', () => {
    const v = vialView(vial({ expires_at: '2026-10-12' }), undefined, now)
    expect(v.expiry).toMatchObject({ days: 7, estimated: false, tone: 'warn' })
    expect(v.expiring).toBe(true)
  })

  it('flags a vial that is running low', () => {
    expect(vialView(vial(), vialRunway(4, daily(20)), now).low).toBe(false)
    expect(vialView(vial({ remaining_mg: 2 }), vialRunway(2, daily(20)), now).low).toBe(true)
    // Nothing planned: a fifth of the vial is what counts.
    expect(vialView(vial({ remaining_mg: 2 }), undefined, now).low).toBe(true)
    expect(vialView(vial({ remaining_mg: 3 }), undefined, now).low).toBe(false)
  })
})

describe('vial mg', () => {
  it('counts a blend as the whole vial, in proportion', () => {
    // 5 mg of the first compound plus 5 mg of the second, 3.7 mg of the first left: the vial
    // is labelled "10 mg" and holds 7.4 mg of both.
    const blend = vial({
      total_mg: 5,
      remaining_mg: 3.7,
      components: [{ compoundId: 'ipamorelin', mg: 5 }],
    })
    expect(vialMg(blend).total).toBe(10)
    expect(vialMg(blend).left).toBeCloseTo(7.4)
    expect(vialView(blend, undefined, now).hero).toEqual({ kind: 'mg', mg: expect.closeTo(7.4) })
  })

  it('is just the amounts of the row for a single substance', () => {
    expect(vialMg(vial())).toEqual({ left: 4, total: 10 })
  })
})
