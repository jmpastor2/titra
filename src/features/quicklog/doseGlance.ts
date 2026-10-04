/**
 * The Toma tile at a glance: what is due now, what comes next, and the fasting-sensitive
 * administration the Ayuno tile counts down to. Built on the same agenda the Today screen
 * uses, so both always agree. Pure; callers pass `now`. See doseGlance.test.ts.
 */
import { compoundName } from '@/content/compounds'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import { planDraw } from '@/domain/dosing/draw'
import type { StackComponent } from '@/domain/types'
import { needsFasting } from '@/features/fasting/fasting'
import { drawPartFor } from '@/features/inventory/vials'
import { upcomingAdministrations } from '@/features/reminders/plan'
import { buildToday, focusItem, type TodayItem } from '@/features/today/agenda'
import { FAST_WINDOW_H, shortName, type DoseStatus } from './tiles'

const HOUR_MS = 3_600_000

export interface GlanceDose {
  protocolId: string
  at: Date
  /** Compounds drawn in this administration, primary first. */
  compoundIds: string[]
  /** Protocol name short enough for a tile. */
  name: string
  /** Syringe units to draw, when every vial involved is known. */
  units: number | null
}

export interface DoseGlance {
  status: DoseStatus
  /** What the tile is about: the dose due, coming up or missed; on a quiet day, the next one. */
  dose: GlanceDose | null
  /** Hours until `dose`; null when there is none. */
  hoursAhead: number | null
  /** A GH-secretagogue administration due now or within the fast window. */
  fastFor: GlanceDose | null
  /** Some active protocol asks for fasting at all. */
  fastingAvailable: boolean
}

/** Units to draw for an administration, when every compound has a reconstituted vial. */
function drawUnits(
  parts: readonly StackComponent[],
  vials: readonly InventoryRow[],
): number | null {
  const plan = planDraw(parts.map((d) => drawPartFor(vials, d.compoundId, d.doseMg)))
  return plan && plan.unknown.length === 0 ? plan.totalUnits : null
}

function fromItem(item: TodayItem, vials: readonly InventoryRow[]): GlanceDose {
  return {
    protocolId: item.protocol.id,
    at: item.at,
    compoundIds: item.doses.map((d) => d.compoundId),
    name: shortName(
      item.protocol.name || item.doses.map((d) => compoundName(d.compoundId)).join(' + '),
    ),
    units: drawUnits(item.doses, vials),
  }
}

export function doseGlance(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  vials: readonly InventoryRow[],
  now: Date,
): DoseGlance {
  const items = buildToday(protocols, doses, now)
  const hoursUntil = (at: Date) => (at.getTime() - now.getTime()) / HOUR_MS
  const fastItem = items.find(
    (i) =>
      (i.status === 'due' ||
        i.status === 'overdue' ||
        (i.status === 'upcoming' && hoursUntil(i.at) < FAST_WINDOW_H)) &&
      needsFasting(i.doses.map((d) => d.compoundId)),
  )
  const shared = {
    fastFor: fastItem ? fromItem(fastItem, vials) : null,
    fastingAvailable: protocols.some(
      (p) => p.status === 'active' && needsFasting(protocolCompoundIds(p)),
    ),
  }

  const focus = focusItem(items)
  if (focus && focus.status !== 'taken' && focus.status !== 'missed') {
    return {
      status: focus.status,
      dose: fromItem(focus, vials),
      hoursAhead: focus.status === 'upcoming' ? hoursUntil(focus.at) : null,
      ...shared,
    }
  }

  const planned = items.filter((i) => !i.extra)
  const missed = planned.findLast((i) => i.status === 'missed')
  if (missed) {
    return { status: 'missed', dose: fromItem(missed, vials), hoursAhead: null, ...shared }
  }

  // Quiet day: show the next administration on a later one.
  const [next] = upcomingAdministrations(protocols, doses, vials, now, { horizonDays: 14 })
  return {
    status: planned.length > 0 ? 'done' : 'none',
    dose: next
      ? {
          protocolId: next.protocol.id,
          at: next.at,
          compoundIds: next.doses.map((d) => d.compoundId),
          name: shortName(
            next.protocol.name || next.doses.map((d) => compoundName(d.compoundId)).join(' + '),
          ),
          units: next.totalUnits,
        }
      : null,
    hoursAhead: next ? hoursUntil(next.at) : null,
    ...shared,
  }
}
