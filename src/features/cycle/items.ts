/**
 * The cycle of every active protocol and what in it needs the person's attention. Pure; see
 * items.test.ts.
 */
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { addDays } from 'date-fns'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import { cycleInfo, type CycleInfo } from '@/domain/dosing/cycle'
import {
  matchDoses,
  matchToleranceH,
  normaliseTimes,
  ownerDay,
  scheduledDoses,
  stepWindows,
} from '@/domain/dosing/schedule'
import type { ProtocolLike } from '@/domain/types'
import { cycleDecision, decisionKey, type CycleDecision } from './decision'
import { doseDrift, driftKey, type DoseDrift } from './drift'

export interface ProtocolCycle {
  protocol: ProtocolRow
  info: CycleInfo
}

/** The cycle of each active protocol that has steps, oldest protocol first. */
export function activeCycles(protocols: readonly ProtocolRow[], now: Date): ProtocolCycle[] {
  return protocols
    .filter((p) => p.status === 'active')
    .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
    .flatMap((protocol) => {
      const info = cycleInfo(toProtocolLike(protocol), now)
      return info ? [{ protocol, info }] : []
    })
}

/** The doses that count as this protocol's: its primary compound, under it or logged freely. */
export function protocolDoses(protocol: ProtocolRow, doses: readonly DoseRow[]): DoseRow[] {
  return doses.filter(
    (d) =>
      d.compound_id === protocol.compound_id && (!d.protocol_id || d.protocol_id === protocol.id),
  )
}

export interface CycleAttention {
  /** The latest doses disagree with the plan and nobody has dealt with it yet. */
  drift: DoseDrift | null
  /** A change to answer or an end to act on; none while a drift is open. */
  decision: CycleDecision | null
}

/**
 * What to put in front of the person for one protocol. A drift comes first: while the plan
 * and the doses disagree, announcing the plan's next change would only mislead. Whatever
 * was already dealt with (`dismissed` holds the alert keys) stays out.
 */
export function attention(
  { protocol, info }: ProtocolCycle,
  doses: readonly DoseRow[],
  dismissed: ReadonlySet<string>,
  now: Date,
  focused = false,
): CycleAttention {
  const pl = toProtocolLike(protocol)
  const rows = protocolDoses(protocol, doses)
  // A drift nobody has dealt with yet.
  const open = (d: DoseDrift | null) =>
    d && !dismissed.has(driftKey(protocol.id, d.sinceDay)) ? d : null

  const drift = open(doseDrift(pl, rows, now))
  if (drift) return { drift, decision: null }

  const decision = cycleDecision(info, now, { focused })
  if (!decision || dismissed.has(decisionKey(protocol.id, decision))) {
    return { drift: null, decision: null }
  }
  // The new step starts today and its first dose was already taken at the new dose: the
  // person went ahead, so there is nothing left to ask.
  if (
    decision.timing === 'today' &&
    decision.to &&
    !decision.to.pause &&
    tookStepDose(pl, rows, decision.to.index, decision.on, decision.to.doseMg, now)
  ) {
    return { drift: null, decision: null }
  }
  // The step went up today, but the doses had already gone up to its dose: nothing to decide.
  const early =
    decision.kind === 'increase' && decision.timing === 'today' && decision.from
      ? open(doseDrift(pl, rows, now, decision.from.index))
      : null
  return { drift: null, decision: early?.matchesNextStep ? null : decision }
}

/**
 * Whether the administration planned on `day` (the first day of step `stepIndex`) was taken
 * at that step's dose. Doses are matched to their slots, so a shot after midnight counts for
 * the evening it belongs to, not for the calendar day it fell on.
 */
function tookStepDose(
  pl: ProtocolLike,
  rows: readonly DoseRow[],
  stepIndex: number,
  day: Date,
  doseMg: number,
  now: Date,
): boolean {
  const window = stepWindows(pl)[stepIndex]
  if (!window || !(doseMg > 0)) return false
  const events = rows
    .filter((r) => r.compound_id === pl.compoundId)
    .map(toDoseEvent)
    .filter((e) => e.mg > 0 && e.at <= now && e.at >= addDays(day, -1))
  const mgAt = new Map(events.map((e) => [e.at.getTime(), e.mg]))
  const { slots } = matchDoses(
    scheduledDoses(pl, addDays(day, -1), addDays(day, 2)),
    events,
    matchToleranceH(window.step, normaliseTimes(pl.times)),
  )
  return slots.some((s) => {
    if (!s.takenAt || ownerDay(s).getTime() !== day.getTime()) return false
    const mg = mgAt.get(s.takenAt.getTime())
    return mg !== undefined && Math.abs(mg - doseMg) / doseMg <= 0.03
  })
}
