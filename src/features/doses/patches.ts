/**
 * Edits to dose rows as `{ id, patch }` pairs for `useUpdateDoses`. Stock follows the
 * database (triggers), so a patch never touches a vial's `remaining_mg`. Pure.
 */
import type { Database, DoseRow } from '@/data/database.types'

export type DoseUpdate = Database['public']['Tables']['doses']['Update']

export interface DosePatch {
  id: string
  patch: DoseUpdate
}

/**
 * Make every row of an administration cover a planned administration (`slot`), or let its
 * time decide again (null). A free dose is linked to the protocol the slot belongs to.
 */
export function assignPatches(
  rows: readonly DoseRow[],
  slot: Date | null,
  protocolId: string | null = null,
): DosePatch[] {
  return rows.map((r) => ({
    id: r.id,
    patch: {
      planned_at: slot ? slot.toISOString() : null,
      ...(protocolId && !r.protocol_id ? { protocol_id: protocolId } : {}),
    },
  }))
}

/** What `assignPatches` changed, put back: the undo of an assignment. */
export function restorePatches(rows: readonly DoseRow[]): DosePatch[] {
  return rows.map((r) => ({
    id: r.id,
    patch: { planned_at: r.planned_at, protocol_id: r.protocol_id },
  }))
}
