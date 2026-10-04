/**
 * The cycle of every active protocol and what in it needs the person's attention. Pure; see
 * items.test.ts.
 */
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { cycleInfo, type CycleInfo } from '@/domain/dosing/cycle'
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
  // The step went up today, but the doses had already gone up to its dose: nothing to decide.
  const early =
    decision.kind === 'increase' && decision.timing === 'today' && decision.from
      ? open(doseDrift(pl, rows, now, decision.from.index))
      : null
  return { drift: null, decision: early?.matchesNextStep ? null : decision }
}
