import type { InventoryRow } from '@/data/database.types'
import { vialConcentration } from '@/domain/dosing/reconstitution'

/** Concentration of a vial: stored, or derived from its content and bacteriostatic water. */
export function concentrationOf(item: InventoryRow): number | null {
  const c = Number(item.concentration_mg_per_ml)
  if (c > 0) return c
  return vialConcentration(Number(item.total_mg), item.diluent_ml ? Number(item.diluent_ml) : null)
}

/**
 * The vial a dose is drawn from: one with something left, reconstituted before
 * lyophilised, and the oldest opened first so it is used up before it expires.
 */
export function activeVial(
  vials: readonly InventoryRow[],
  compoundId: string,
): InventoryRow | undefined {
  const rank = (v: InventoryRow) => (concentrationOf(v) ? 0 : 1)
  return vials
    .filter((v) => v.compound_id === compoundId && !v.archived && Number(v.remaining_mg) > 0)
    .toSorted(
      (a, b) => rank(a) - rank(b) || (a.opened_at ?? '9999').localeCompare(b.opened_at ?? '9999'),
    )[0]
}
