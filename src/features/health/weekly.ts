/**
 * "What changed this week": plain facts computed from the last 7 days against the 7
 * before, as typed items the UI turns into sentences. Pure; callers pass `now`.
 */
import { addDays, startOfDay } from 'date-fns'
import type { MeasurementKind, ProtocolRow, SymptomKind } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { stepChanges, type StepChange } from '@/features/exposure/chartScale'
import type { AdherenceTotal } from './consistency'
import type { TimePoint } from './progress'
import { meanIn } from './trend'

const DAY_MS = 86_400_000

export type WeekItem =
  /** Mean of this week's readings against last week's. */
  | { kind: 'body'; metric: 'weight' | 'waist'; delta: number }
  /** Days with a weigh-in this week, when there is nothing to compare them with yet. */
  | { kind: 'weighIns'; count: number }
  /** Doses taken against doses due; `offTime` counts those taken more than an hour from their time (null: not known). */
  | { kind: 'adherence'; taken: number; expected: number; offTime: number | null }
  /** The wellbeing dimension that moved the most against last week. */
  | { kind: 'score'; metric: MeasurementKind; delta: number }
  | { kind: 'checkIns'; count: number }
  | { kind: 'symptoms'; count: number; top: SymptomKind | null }
  | {
      kind: 'step'
      protocolId: string
      name: string
      compoundId: string
      unit: string
      change: StepChange
      upcoming: boolean
    }

export interface WeekInput {
  now: Date
  weight: readonly TimePoint[]
  waist: readonly TimePoint[]
  /** Wellbeing scores by dimension. */
  scores: ReadonlyMap<MeasurementKind, readonly TimePoint[]>
  /** Local midnights of the days with a check-in. */
  checkInDays: ReadonlySet<number>
  adherence: AdherenceTotal
  /** Taken doses this week split by timing, when known. */
  timing: { onTime: number; offTime: number } | null
  symptoms: readonly { at: Date; kind: SymptomKind }[]
  protocols: readonly ProtocolRow[]
}

/** Score moves smaller than this are not worth a line. */
export const SCORE_MOVE_MIN = 0.5

function bodyItem(
  metric: 'weight' | 'waist',
  points: readonly TimePoint[],
  now: Date,
): WeekItem | null {
  const cur = meanIn(points, now, 7)
  const prev = meanIn(points, addDays(now, -7), 7)
  if (cur === null) return null
  if (prev === null) {
    if (metric !== 'weight') return null
    const from = now.getTime() - 7 * DAY_MS
    const days = new Set(
      points
        .filter((p) => p.at.getTime() > from && p.at <= now)
        .map((p) => startOfDay(p.at).getTime()),
    )
    return { kind: 'weighIns', count: days.size }
  }
  return { kind: 'body', metric, delta: cur - prev }
}

function scoreItem(
  scores: ReadonlyMap<MeasurementKind, readonly TimePoint[]>,
  now: Date,
): WeekItem | null {
  let best: { metric: MeasurementKind; delta: number } | null = null
  for (const [metric, pts] of scores) {
    const cur = meanIn(pts, now, 7)
    const prev = meanIn(pts, addDays(now, -7), 7)
    if (cur === null || prev === null) continue
    const delta = cur - prev
    if (Math.abs(delta) >= SCORE_MOVE_MIN && (!best || Math.abs(delta) > Math.abs(best.delta))) {
      best = { metric, delta }
    }
  }
  return best ? { kind: 'score', ...best } : null
}

/** Dose steps that changed in the last 7 days or change in the next 7, soonest first. */
export function stepItems(protocols: readonly ProtocolRow[], now: Date): WeekItem[] {
  const from = addDays(now, -7)
  const to = addDays(now, 7)
  return protocols
    .filter((p) => p.status === 'active')
    .flatMap((row) =>
      stepChanges(toProtocolLike(row), from, to).map((change): WeekItem => ({
        kind: 'step',
        protocolId: row.id,
        name: row.name,
        compoundId: row.compound_id,
        unit: row.unit,
        change,
        upcoming: change.at > now,
      })),
    )
    .toSorted((a, b) =>
      a.kind === 'step' && b.kind === 'step' ? a.change.at.getTime() - b.change.at.getTime() : 0,
    )
}

export function weekChanges(input: WeekInput): WeekItem[] {
  const { now } = input
  const out: WeekItem[] = []
  const weight = bodyItem('weight', input.weight, now)
  if (weight) out.push(weight)
  const waist = bodyItem('waist', input.waist, now)
  if (waist) out.push(waist)

  if (input.adherence.expected > 0) {
    out.push({
      kind: 'adherence',
      taken: input.adherence.taken,
      expected: input.adherence.expected,
      offTime: input.timing ? input.timing.offTime : null,
    })
  }

  const score = scoreItem(input.scores, now)
  if (score) out.push(score)
  else {
    const from = addDays(now, -7).getTime()
    const count = [...input.checkInDays].filter((d) => d > from && d <= now.getTime()).length
    if (count > 0) out.push({ kind: 'checkIns', count })
  }

  const recent = input.symptoms.filter(
    (s) => s.at.getTime() > now.getTime() - 7 * DAY_MS && s.at <= now,
  )
  if (recent.length > 0) {
    const counts = new Map<SymptomKind, number>()
    for (const s of recent) counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1)
    const top = [...counts.entries()].toSorted((a, b) => b[1] - a[1])[0]
    out.push({ kind: 'symptoms', count: recent.length, top: top && top[1] > 1 ? top[0] : null })
  }

  out.push(...stepItems(input.protocols, now))
  return out
}
