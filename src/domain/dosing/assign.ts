/**
 * Which planned administration a logged dose stands for. Taking a dose late, or taking
 * an extra one to make up a missed administration, must not leave a "missed" and an
 * "extra" behind: the user can say "this one covers Monday's".
 *
 * Pure; see assign.test.ts.
 */
import { addDays } from 'date-fns'
import type { DoseEvent, ProtocolLike } from '../types'
import {
  currentStep,
  matchDoses,
  matchToleranceH,
  normaliseTimes,
  scheduledDoses,
  type PlannedDose,
} from './schedule'

const HOUR_MS = 3_600_000

export interface SlotChoices {
  /** Where the dose lands on its own, by time. Null when it matches nothing: an extra. */
  auto: PlannedDose | null
  /** Planned administrations of the last days that nobody covers, most recent first. */
  missed: PlannedDose[]
}

const slotOnly = ({ at, doseMg, stepIndex, day }: PlannedDose & { takenAt: Date | null }) => ({
  at,
  doseMg,
  stepIndex,
  ...(day ? { day } : {}),
})

/**
 * The slots a dose taken at `doseAt` could cover. `history` is every other dose of the
 * protocol's primary compound, so it must not contain the dose being logged or edited.
 */
export function slotChoices(
  protocol: ProtocolLike,
  history: readonly DoseEvent[],
  doseAt: Date,
  now: Date,
  lookbackDays = 14,
): SlotChoices {
  const tolH = matchToleranceH(currentStep(protocol, doseAt)?.step, normaliseTimes(protocol.times))
  const slots = scheduledDoses(protocol, addDays(doseAt, -lookbackDays), addDays(doseAt, 2))
  const probe: DoseEvent = { at: new Date(doseAt), mg: 0 }
  const { slots: matched } = matchDoses(slots, [...history, probe], tolH)

  // The matcher hands back the very Date object it was given, so identity finds the probe.
  const auto = matched.find((m) => m.takenAt === probe.at)
  const missed = matched
    .filter(
      (m) =>
        m.takenAt === null &&
        // Past its grace window; still inside it is "due", not missed.
        m.at.getTime() + tolH * HOUR_MS < now.getTime(),
    )
    .toSorted((a, b) => b.at.getTime() - a.at.getTime())

  return { auto: auto ? slotOnly(auto) : null, missed: missed.map(slotOnly) }
}
