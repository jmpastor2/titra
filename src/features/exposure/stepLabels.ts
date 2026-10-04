import type { DoseUnit } from '@/domain/types'
import { fmtDose, type Locale } from '@/lib/format'
import type { StepChange } from './chartScale'

/** The short label of a dose change on a chart: "↑ 1,5 mg", "↓ 100 mcg", "▸ 2 mg", "Pausa". */
export function stepLabel(
  change: Pick<StepChange, 'kind' | 'doseMg'>,
  unit: DoseUnit,
  locale: Locale,
  pauseText: string,
): string {
  if (change.kind === 'pause') return pauseText
  const arrow = change.kind === 'down' ? '↓' : change.kind === 'up' ? '↑' : '▸'
  return `${arrow} ${fmtDose(change.doseMg, unit, locale)}`
}

/**
 * Which step labels keep their place when the chart is too narrow for all of them: the step
 * in force first, then the ones still to come, then the older ones.
 */
export function stepPriority(atMs: number, nowMs: number, allMs: readonly number[]): number {
  if (atMs > nowMs) return 5
  const inForce = allMs.reduce((latest, t) => (t <= nowMs && t > latest ? t : latest), -Infinity)
  return atMs === inForce ? 7 : 3
}
