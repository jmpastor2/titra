/**
 * Upcoming administrations to remind about, computed on the device in its own time zone.
 * The server only stores and sends what this produces (see supabase/functions/send-reminders).
 * Pure; see plan.test.ts.
 */
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { planDraw } from '@/domain/dosing/draw'
import {
  currentStep,
  matchOccurrences,
  matchToleranceH,
  normaliseTimes,
  plannedDoses,
} from '@/domain/dosing/schedule'
import type { StackComponent } from '@/domain/types'
import { activeVial, concentrationOf } from '@/features/inventory/vials'

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

export interface UpcomingAdministration {
  protocol: ProtocolRow
  /** Scheduled administration time. */
  at: Date
  /** When to notify: `at` minus the user's lead time. */
  fireAt: Date
  /** Every compound drawn in this administration, primary first. */
  doses: StackComponent[]
  /** Syringe loads in drawing order, when every vial's concentration is known. */
  loads: { compoundId: string; units: number; to: number }[] | null
  totalUnits: number | null
  /** How far from `at` a logged dose still counts as this administration. */
  toleranceMin: number
}

export interface UpcomingOptions {
  leadMin?: number
  horizonDays?: number
}

export function upcomingAdministrations(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  vials: readonly InventoryRow[],
  now: Date,
  { leadMin = 0, horizonDays = 14 }: UpcomingOptions = {},
): UpcomingAdministration[] {
  const to = new Date(now.getTime() + horizonDays * DAY_MS)
  const out: UpcomingAdministration[] = []

  for (const protocol of protocols) {
    if (protocol.status !== 'active') continue
    const pl = toProtocolLike(protocol)
    const history = doses
      .filter(
        (d) =>
          d.compound_id === protocol.compound_id &&
          (!d.protocol_id || d.protocol_id === protocol.id),
      )
      .map(toDoseEvent)
    const tolH = matchToleranceH(currentStep(pl, now)?.step, normaliseTimes(pl.times))
    // Start one tolerance back so a dose logged early still cancels its reminder.
    const planned = plannedDoses(pl, history, new Date(now.getTime() - tolH * HOUR_MS), to)

    for (const o of matchOccurrences(planned, history, tolH)) {
      if (o.takenAt || !(o.doseMg > 0)) continue
      const fireAt = new Date(o.at.getTime() - leadMin * 60_000)
      if (fireAt.getTime() <= now.getTime()) continue
      const parts: StackComponent[] = [
        { compoundId: protocol.compound_id, doseMg: o.doseMg },
        ...(pl.components ?? []),
      ]
      const draw = planDraw(
        parts.map((p) => {
          const vial = activeVial(vials, p.compoundId)
          return { ...p, concMgPerMl: vial ? concentrationOf(vial) : null }
        }),
      )
      const complete = draw && draw.unknown.length === 0
      out.push({
        protocol,
        at: o.at,
        fireAt,
        doses: parts,
        loads: complete
          ? draw.loads.map((l) => ({ compoundId: l.compoundId, units: l.units, to: l.to }))
          : null,
        totalUnits: complete ? draw.totalUnits : null,
        toleranceMin: Math.round(tolH * 60),
      })
    }
  }
  return out.toSorted((a, b) => a.at.getTime() - b.at.getTime())
}

/** A stable fingerprint of what would be sent, to skip redundant syncs. */
export function fingerprint(rows: readonly unknown[]): string {
  const s = JSON.stringify(rows)
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${rows.length}:${(h >>> 0).toString(36)}`
}
