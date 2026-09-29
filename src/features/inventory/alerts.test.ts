import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import { effectiveExpiry, stockAlerts } from './alerts'
import { restockPlan, vialRunway } from './vials'

const vial = (over: Partial<InventoryRow>): InventoryRow =>
  ({
    id: 'v',
    patient_id: 'u',
    compound_id: 'mots-c',
    form: 'vial',
    label: 'MOTS-c 10 mg',
    total_mg: 10,
    remaining_mg: 2.5,
    concentration_mg_per_ml: 10,
    diluent_ml: 1,
    components: [],
    opened_at: '2026-09-07',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '',
    updated_at: '',
    ...over,
  }) as InventoryRow

const at = (d: string) => new Date(`${d}T09:00`)

describe('stock alerts', () => {
  it('estimates expiry 28 days after reconstitution, and uses the label when there is one', () => {
    expect(effectiveExpiry(vial({}))).toEqual({
      date: new Date('2026-10-05T00:00'),
      estimated: true,
    })
    expect(effectiveExpiry(vial({ expires_at: '2026-12-01' }))!.estimated).toBe(false)
    expect(
      effectiveExpiry(vial({ concentration_mg_per_ml: null, diluent_ml: null, opened_at: null })),
    ).toBeNull()
  })

  it('asks to reconstitute the reserve and warns about expiry and reorder', () => {
    const open = vial({})
    const reserve = vial({
      id: 'r',
      label: 'MOTS-c reserva',
      remaining_mg: 10,
      concentration_mg_per_ml: null,
      diluent_ml: null,
      opened_at: null,
    })
    const doses = [
      '2026-09-30',
      '2026-10-02',
      '2026-10-05',
      '2026-10-07',
      '2026-10-09',
      '2026-10-12',
      '2026-10-14',
      '2026-10-16',
      '2026-10-19',
      '2026-10-21',
    ].map((d) => ({ at: at(d), doseMg: 1.5 }))
    const runways = new Map([['v', vialRunway(2.5, doses)]])
    const restock = restockPlan([open, reserve], new Map([['mots-c', doses]]))
    const alerts = stockAlerts([open, reserve], restock, runways, new Date('2026-09-30T08:00'))
    const kinds = alerts.map((a) => a.kind)
    expect(kinds).toContain('reconstitute')
    expect(kinds).toContain('expiresSoon') // estimated 5 Oct
    expect(kinds).toContain('reorder') // 12.5 mg covers 8 doses: short on 19 Oct
    expect(alerts.find((a) => a.kind === 'reconstitute')!.doses).toBe(1)
  })

  it('flags an expired vial first', () => {
    const alerts = stockAlerts(
      [vial({ expires_at: '2026-09-20' })],
      [],
      new Map(),
      new Date('2026-09-30T08:00'),
    )
    expect(alerts[0]!.kind).toBe('expired')
    expect(alerts[0]!.severity).toBe('danger')
  })
})
