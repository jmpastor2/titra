import type { InventoryRow } from '@/data/database.types'
import { vialConcentration } from '@/domain/dosing/reconstitution'

/** Concentration of a vial: stored, or derived from its content and bacteriostatic water. */
export function concentrationOf(item: InventoryRow): number | null {
  const c = Number(item.concentration_mg_per_ml)
  if (c > 0) return c
  return vialConcentration(Number(item.total_mg), item.diluent_ml ? Number(item.diluent_ml) : null)
}
