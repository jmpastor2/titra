/**
 * The one number each scenario of the simulator leaves you with. Pure; see insight.test.ts.
 */
import { washoutHours, type CurvePoint } from '@/domain/pk/engine'
import type { PkParams } from '@/domain/types'

export type Scenario = 'planned' | 'skip_next' | 'stop' | 'switch'

export type Insight =
  /** The lowest level the curve reaches after skipping, and the lowest one following the plan. */
  | { kind: 'skip'; lowestMg: number; planLowestMg: number }
  /** Hours for what is on board to fall to a tenth. */
  | { kind: 'stop'; washoutH: number }

export function lowestLevel(points: readonly CurvePoint[]): number | null {
  if (points.length === 0) return null
  return points.reduce((m, p) => Math.min(m, p.mg), Number.POSITIVE_INFINITY)
}

export function scenarioInsight(
  scenario: Scenario,
  pk: PkParams,
  main: readonly CurvePoint[],
  alt: readonly CurvePoint[] | null,
): Insight | null {
  if (scenario === 'skip_next' && alt) {
    const lowestMg = lowestLevel(alt)
    const planLowestMg = lowestLevel(main)
    return lowestMg === null || planLowestMg === null
      ? null
      : { kind: 'skip', lowestMg, planLowestMg }
  }
  if (scenario === 'stop') return { kind: 'stop', washoutH: washoutHours(0.1, pk) }
  return null
}
