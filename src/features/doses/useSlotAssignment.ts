import { useMemo, useState } from 'react'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { slotChoices } from '@/domain/dosing/assign'
import { scheduledDoses } from '@/domain/dosing/schedule'
import { administrationKey } from './administrations'
import {
  buildSlotView,
  consequenceOf,
  selectedOption,
  type Consequence,
  type SlotOption,
  type SlotView,
} from './slotView'
import { protocolDoseRows } from './week'

export interface SlotAssignment {
  protocol: ProtocolRow
  view: SlotView
  selected: SlotOption
  /** Saved as `planned_at`: the administration chosen, or null to let the time decide. */
  plannedAt: Date | null
  consequence: Consequence
  doseAt: Date
  choose: (key: string) => void
}

export interface SlotAssignmentInput {
  /** The protocol the dose belongs to; without one there is nothing to assign to. */
  protocol: ProtocolRow | undefined
  /** Every dose row known, the one being edited included. */
  doses: readonly DoseRow[]
  /** The administration being edited, left out so it does not cover a slot on its own. */
  excludeKey?: string
  doseAt: Date
  now: Date
  /** Editing: what the dose is assigned to now (null = nothing). Omit when logging. */
  current?: Date | null
  /** Logging: the planned time the person came to log. */
  preferred?: Date | null
}

/**
 * "Cuenta para": where a dose lands by itself and the missed administrations it could make
 * up, with the person's choice. Until they choose, the default stands (a late make-up
 * selects the missed one it stands for). Null when the dose belongs to no protocol.
 */
export function useSlotAssignment({
  protocol,
  doses,
  excludeKey,
  doseAt,
  now,
  current,
  preferred,
}: SlotAssignmentInput): SlotAssignment | null {
  const [choice, setChoice] = useState<string | null>(null)
  const doseMs = doseAt.getTime()
  const nowMs = now.getTime()
  const currentMs = current === undefined ? undefined : (current?.getTime() ?? null)
  const preferredMs = preferred?.getTime() ?? null

  const view = useMemo(() => {
    if (!protocol) return null
    const pl = toProtocolLike(protocol)
    const at = new Date(doseMs)
    const history = protocolDoseRows(protocol, doses)
      .filter((r) => administrationKey(r) !== excludeKey)
      .map(toDoseEvent)
    return buildSlotView({
      choices: slotChoices(pl, history, at, new Date(nowMs)),
      doseAt: at,
      ...(currentMs !== undefined
        ? { current: currentMs === null ? null : new Date(currentMs) }
        : {}),
      ...(preferredMs !== null ? { preferred: new Date(preferredMs) } : {}),
      lookup: (when) => scheduledDoses(pl, when, new Date(when.getTime() + 1))[0] ?? null,
    })
  }, [protocol, doses, excludeKey, doseMs, nowMs, currentMs, preferredMs])

  if (!protocol || !view) return null
  const selected = selectedOption(view, choice)
  return {
    protocol,
    view,
    selected,
    plannedAt: selected.plannedAt,
    consequence: consequenceOf(selected, new Date(doseMs)),
    doseAt: new Date(doseMs),
    choose: setChoice,
  }
}
