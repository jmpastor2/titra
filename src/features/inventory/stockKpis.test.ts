import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import { coverGauge, stockKpis, supplyTone } from './stockKpis'
import { restockPlan } from './vials'

const vial = (over: Partial<InventoryRow>): InventoryRow =>
  ({
    id: 'v',
    patient_id: 'u',
    compound_id: 'mots-c',
    form: 'vial',
    label: 'MOTS-c 10 mg',
    total_mg: 10,
    remaining_mg: 10,
    concentration_mg_per_ml: 10,
    diluent_ml: 1,
    components: [],
    opened_at: '2026-10-01',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '',
    updated_at: '',
    ...over,
  }) as InventoryRow

const powder = (over: Partial<InventoryRow> = {}) =>
  vial({
    id: 'r',
    label: 'MOTS-c reserva',
    concentration_mg_per_ml: null,
    diluent_ml: null,
    opened_at: null,
    ...over,
  })

const now = new Date('2026-10-05T10:00:00')
/** One administration of `doseMg` per day from 6 Oct, `n` of them. */
const daily = (n: number, doseMg = 1) =>
  Array.from({ length: n }, (_, i) => ({ at: new Date(2026, 9, 6 + i, 9), doseMg }))

describe('stock KPIs', () => {
  it('counts what is open and what waits, leaving out finished and archived vials', () => {
    const k = stockKpis(
      [
        vial({ id: 'a' }),
        vial({ id: 'b' }),
        powder({ id: 'c' }),
        vial({ id: 'd', remaining_mg: 0 }),
        powder({ id: 'e', archived: true }),
      ],
      [],
      now,
    )
    expect(k.inUse).toBe(2)
    expect(k.reserve).toBe(1)
  })

  it('has no cover, expiry or order date when there is nothing to plan with', () => {
    const k = stockKpis([powder({})], [], now)
    expect(k.cover).toBeNull()
    expect(k.reorder).toBeNull()
    expect(k.nextExpiry).toBeNull()
  })

  it('takes the cover and the order date from the substance that runs out first', () => {
    const vials = [
      vial({ id: 'a', remaining_mg: 4 }),
      vial({ id: 'b', compound_id: 'retatrutide', label: 'Reta', remaining_mg: 15 }),
    ]
    const restock = restockPlan(
      vials,
      new Map([
        ['mots-c', daily(30)],
        ['retatrutide', daily(30, 1)],
      ]),
    )
    const k = stockKpis(vials, restock, now)
    // 4 mg at 1 mg a day: the fifth administration (10 Oct) is the first it cannot cover.
    expect(k.cover).toEqual({ days: 5, date: new Date(2026, 9, 10, 9), compoundIds: ['mots-c'] })
    // Order 21 days ahead of that: already late.
    expect(k.reorder).toEqual({
      date: new Date(2026, 8, 19, 9),
      days: -16,
      runsOutAt: new Date(2026, 9, 10, 9),
      compoundIds: ['mots-c'],
    })
  })

  it('says the stock is plentiful when every substance outlasts the schedule', () => {
    const vials = [vial({ remaining_mg: 10 })]
    const restock = restockPlan(vials, new Map([['mots-c', daily(3)]]))
    const k = stockKpis(vials, restock, now)
    expect(k.cover).toEqual({ days: null, date: null, compoundIds: [] })
    expect(k.reorder).toBeNull()
  })

  it('finds the vial that expires first, estimating it from the in-use period when it has no label date', () => {
    const k = stockKpis(
      [
        vial({ id: 'a', label: 'A', opened_at: '2026-10-01' }),
        vial({ id: 'b', label: 'B', opened_at: '2026-09-20' }),
        vial({ id: 'c', label: 'C', opened_at: '2026-09-01', archived: true }),
        vial({ id: 'd', label: 'D', opened_at: '2026-09-01', remaining_mg: 0 }),
      ],
      [],
      now,
    )
    // B was opened 20 Sep: 28 days later is 18 Oct, 13 days from now. Archived and empty ones are ignored.
    expect(k.nextExpiry).toMatchObject({
      label: 'B',
      days: 13,
      estimated: true,
      compoundId: 'mots-c',
    })
  })

  it('prefers a label date that comes before the in-use period', () => {
    const k = stockKpis(
      [
        vial({ id: 'a', label: 'A', opened_at: '2026-10-01' }),
        powder({ id: 'b', label: 'B', expires_at: '2026-10-08' }),
      ],
      [],
      now,
    )
    expect(k.nextExpiry).toMatchObject({ label: 'B', days: 3, estimated: false })
  })
})

describe('supply tone and gauge', () => {
  it('is urgent within two weeks, careful within a month and fine beyond or without a date', () => {
    expect(supplyTone(0)).toBe('danger')
    expect(supplyTone(14)).toBe('danger')
    expect(supplyTone(15)).toBe('warn')
    expect(supplyTone(30)).toBe('warn')
    expect(supplyTone(31)).toBe('ok')
    expect(supplyTone(null)).toBe('ok')
  })

  it('fills a gauge up to three months and keeps it full when nothing runs out', () => {
    expect(coverGauge(null)).toBe(1)
    expect(coverGauge(45)).toBe(0.5)
    expect(coverGauge(400)).toBe(1)
    expect(coverGauge(-3)).toBe(0)
  })
})
