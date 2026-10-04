/**
 * Test helper: the dev lab's account (retatrutide weekly, MOTS-c Mon/Wed/Fri, the CJC-1295 +
 * ipamorelina blend taken after midnight; one missed night) derived at a given instant.
 */
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { buildStore } from '@/dev/fixtures'
import { deriveExposure, type CompoundExposure } from './useExposure'

export function labAccount(now: Date) {
  const store = buildStore(now)
  const protocols = store.protocols as unknown as ProtocolRow[]
  const doses = store.doses as unknown as DoseRow[]
  const vials = store.inventory as unknown as InventoryRow[]
  const items = deriveExposure(protocols, doses, now)
  const byId = (id: string): CompoundExposure => {
    const found = items.find((x) => x.compoundId === id)
    if (!found) throw new Error(`no ${id} in the lab account`)
    return found
  }
  return { store, protocols, doses, vials, items, byId }
}

/** A weekly retatrutide protocol on Mondays at 09:00, 1.5 mg, started on 5 Jan 2026. */
export function weeklyProtocol(over: Partial<ProtocolRow> = {}): ProtocolRow {
  return {
    id: 'p1',
    patient_id: 'lab-user',
    created_by: 'lab-user',
    compound_id: 'retatrutide',
    name: 'Retatrutida',
    route: 'sc',
    unit: 'mg',
    start_date: '2026-01-05',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [{ doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: null }],
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
    ...over,
  }
}

export function doseRow(at: Date, mg: number, over: Partial<DoseRow> = {}): DoseRow {
  return {
    id: `d-${at.getTime()}-${mg}`,
    patient_id: 'lab-user',
    protocol_id: 'p1',
    compound_id: 'retatrutide',
    dose_mg: mg,
    administered_at: at.toISOString(),
    site_id: null,
    inventory_id: null,
    batch_id: null,
    planned_at: null,
    notes: null,
    created_at: at.toISOString(),
    ...over,
  }
}
