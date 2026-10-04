/**
 * Doses that cover no planned administration ("extras") and, for each, the missed ones it
 * could make up. Taking a dose late and then an extra one must not leave "one missed + one
 * extra": the extra is offered the administration it most plausibly stands for.
 *
 * Built on the week card's matching (`doseCells`), so the log, the week card and the Today
 * ring always agree on what is an extra. Pure; see extras.test.ts.
 */
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { slotChoices } from '@/domain/dosing/assign'
import type { PlannedDose } from '@/domain/dosing/schedule'
import { administrationKey } from './administrations'
import { suggestSlot } from './slotView'
import { protocolDoseRows, type WeekCell } from './week'

export interface ExtraDose {
  /** Key of the administration (see `administrationKey`). */
  key: string
  protocol: ProtocolRow
  at: Date
  /** Planned administrations of the protocol nobody covers that it could make up, latest first. */
  missed: PlannedDose[]
  /** The one it most plausibly stands for: one tap assigns it. */
  suggested: PlannedDose | null
}

/**
 * The extras among `cells` (from `doseCells`), by administration key, with the missed
 * administrations each could cover. `doses` are the rows the cells were built from.
 */
export function findExtras(
  cells: ReadonlyMap<string, WeekCell>,
  doses: readonly DoseRow[],
  now: Date,
): Map<string, ExtraDose> {
  const out = new Map<string, ExtraDose>()
  for (const [key, cell] of cells) {
    if (cell.status !== 'extra' || !cell.takenAt) continue
    const { protocol, takenAt } = cell
    // Every other dose of the protocol: the dose itself must not count as covering a slot.
    const others = protocolDoseRows(protocol, doses)
      .filter((r) => administrationKey(r) !== key)
      .map(toDoseEvent)
    const { missed } = slotChoices(toProtocolLike(protocol), others, takenAt, now)
    out.set(key, { key, protocol, at: takenAt, missed, suggested: suggestSlot(missed, takenAt) })
  }
  return out
}
