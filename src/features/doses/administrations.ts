/**
 * The log is a list of administrations, not of dose rows: a same-syringe stack or a blend
 * is several rows sharing a `batch_id` and is one injection. Pure; see administrations.test.ts.
 */
import { startOfDay } from 'date-fns'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { roundUnits } from '@/domain/dosing/draw'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import type { SiteUse } from '@/domain/sites/injectionSites'
import { concentrationFor, isBlend, vialHas } from '@/features/inventory/vials'
import type { Fit } from './delta'
import { shortNames } from './substanceNames'

/** One administration: a single row, or every row of a same-syringe stack or blend. */
export interface Administration {
  /** The batch_id, or the row id of a single dose. */
  key: string
  at: Date
  /** The row that drew from the vial first, then the ones that ride along. */
  rows: DoseRow[]
}

export const administrationKey = (row: Pick<DoseRow, 'id' | 'batch_id'>): string =>
  row.batch_id ?? row.id

/** Rows into administrations, most recent first. */
export function groupAdministrations(rows: readonly DoseRow[]): Administration[] {
  const map = new Map<string, Administration>()
  for (const r of rows) {
    const key = administrationKey(r)
    const a = map.get(key)
    if (a) a.rows.push(r)
    else map.set(key, { key, at: new Date(r.administered_at), rows: [r] })
  }
  for (const a of map.values())
    a.rows.sort((x, y) => Number(Boolean(y.inventory_id)) - Number(Boolean(x.inventory_id)))
  return [...map.values()].toSorted((a, b) => b.at.getTime() - a.at.getTime())
}

/**
 * The protocol an administration belongs to: the one it is linked to or, for a free dose,
 * the one whose primary compound it carries (by its time it belongs to that plan all the same).
 */
export function protocolOf(
  rows: readonly DoseRow[],
  protocols: readonly ProtocolRow[],
): ProtocolRow | undefined {
  const linked = rows.find((r) => r.protocol_id)?.protocol_id
  return (
    (linked ? protocols.find((p) => p.id === linked) : undefined) ??
    protocols.find(
      (p) => p.status !== 'archived' && rows.some((r) => r.compound_id === p.compound_id),
    )
  )
}

/**
 * What to call an administration in a list: its substances in one line, without the
 * qualifiers in brackets ("CJC-1295 + Ipamorelina", not "CJC-1295 (sin DAC) + Ipamorelina").
 */
export function substanceLine(a: Pick<Administration, 'rows'>): string {
  return shortNames(a.rows.map((r) => r.compound_id))
}

/** What an administration is made of, for filters: one entry per thing you inject. */
export const comboKey = (a: Pick<Administration, 'rows'>): string =>
  a.rows.map((r) => r.compound_id).join('+')

export interface DayGroup {
  key: string
  day: Date
  items: Administration[]
}

/** Administrations (already ordered) into calendar days, keeping the order. */
export function groupByDay(admins: readonly Administration[]): DayGroup[] {
  const days = new Map<string, DayGroup>()
  for (const a of admins) {
    const day = startOfDay(a.at)
    const key = String(day.getTime())
    const group = days.get(key)
    if (group) group.items.push(a)
    else days.set(key, { key, day, items: [a] })
  }
  return [...days.values()]
}

export interface DaySummary {
  count: number
  /** Taken more than an hour after their planned time, make-ups included. */
  late: number
  extras: number
}

export function summariseDay(
  items: readonly Administration[],
  fits: ReadonlyMap<string, Fit>,
): DaySummary {
  let late = 0
  let extras = 0
  for (const a of items) {
    const kind = fits.get(a.key)?.kind
    if (kind === 'late' || kind === 'makeUp') late++
    else if (kind === 'extra') extras++
  }
  return { count: items.length, late, extras }
}

/**
 * Syringe units drawn for an administration, one entry per draw: [6] for a blend, [10, 5]
 * for two compounds drawn one after another. Null when a vial is unknown or not reconstituted.
 */
export function drawnUnits(
  rows: readonly DoseRow[],
  vials: ReadonlyMap<string, InventoryRow>,
): number[] | null {
  // A blend vial is one draw for all its compounds: count the row that took from it.
  const blendRow = rows.find((r) => {
    const v = r.inventory_id ? vials.get(r.inventory_id) : undefined
    return v && isBlend(v) && rows.every((x) => vialHas(v, x.compound_id))
  })
  const units: number[] = []
  for (const r of blendRow ? [blendRow] : rows) {
    const vial = r.inventory_id ? vials.get(r.inventory_id) : undefined
    const conc = vial ? concentrationFor(vial, r.compound_id) : null
    if (!conc) return null
    units.push(roundUnits(mgToUnits(Number(r.dose_mg), conc)))
  }
  return units.length ? units : null
}

/**
 * Every use of a site, for the rotation: one entry per dose row (a blend counts as one
 * injection there). `exclude` leaves out the rows of the administration being edited.
 */
export function siteHistory(doses: readonly DoseRow[], exclude: readonly string[] = []): SiteUse[] {
  return doses.flatMap((d) =>
    d.site_id && !exclude.includes(d.id)
      ? [{ siteId: d.site_id, at: new Date(d.administered_at), compoundId: d.compound_id }]
      : [],
  )
}

export interface VialRefund {
  vial: InventoryRow
  /** mg the vial gets back. */
  mg: number
}

/**
 * What deleting an administration gives back to each vial: the dose of every row that
 * drew from one (the database returns it; the rows that ride along took nothing).
 */
export function vialRefunds(
  rows: readonly DoseRow[],
  vials: ReadonlyMap<string, InventoryRow>,
): VialRefund[] {
  const byVial = new Map<string, VialRefund>()
  for (const r of rows) {
    const vial = r.inventory_id ? vials.get(r.inventory_id) : undefined
    if (!vial) continue
    const refund = byVial.get(vial.id)
    if (refund) refund.mg += Number(r.dose_mg)
    else byVial.set(vial.id, { vial, mg: Number(r.dose_mg) })
  }
  return [...byVial.values()]
}
