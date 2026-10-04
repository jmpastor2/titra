/**
 * Which decision to put in front of the person when several are due: one open at a time,
 * the most urgent first, so they do not fill the screen. Pure; see queue.test.ts.
 */
import { decisionKey, type CycleDecision } from './decision'
import type { CycleAttention, ProtocolCycle } from './items'

/** A protocol's cycle with what needs attention in it. */
export type Item = ProtocolCycle & CycleAttention

/** A decision waiting for an answer, with the key it is remembered under. */
export interface Pending {
  item: Item
  decision: CycleDecision
  key: string
}

/**
 * Decisions that ask for an answer come before the ones that only inform; then the soonest.
 * The one a notification pointed at comes first of all.
 */
const urgency = ({ item, decision: d }: Pending, focusId: string | null) =>
  (item.protocol.id === focusId ? -10_000 : 0) +
  (d.kind === 'increase' || d.kind === 'rest' ? 0 : 1000) +
  d.daysAway

export function pendingDecisions(items: readonly Item[], focusId: string | null): Pending[] {
  return items
    .flatMap((item) =>
      item.decision
        ? [{ item, decision: item.decision, key: decisionKey(item.protocol.id, item.decision) }]
        : [],
    )
    .toSorted((a, b) => urgency(a, focusId) - urgency(b, focusId))
}

/**
 * The key of the decision that is open: what the person chose, else the one a notification
 * pointed at, else the most urgent. Those put off for today stay folded, unless they are the
 * one a notification pointed at.
 */
export function openDecision(
  pending: readonly Pending[],
  {
    focusId,
    chosenKey,
    isLater,
  }: { focusId: string | null; chosenKey: string | null; isLater: (key: string) => boolean },
): string | undefined {
  const focused = pending.find((p) => p.item.protocol.id === focusId)
  const queue = pending.filter((p) => p === focused || !isLater(p.key))
  return queue.find((p) => p.key === chosenKey)?.key ?? focused?.key ?? queue[0]?.key
}
