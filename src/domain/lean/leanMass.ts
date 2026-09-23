/**
 * "Guardián de masa magra": GLP-1 therapy can lose 25–40% of weight as lean mass
 * without resistance training and adequate protein. Targets follow common
 * clinical guidance (≥1.2–1.6 g/kg/day protein, ≥2 resistance sessions/week).
 */

export function proteinTarget(weightKg: number, gPerKg = 1.6): number {
  if (!(weightKg > 0)) return 0
  return Math.round(weightKg * gPerKg)
}

export interface WeightPoint {
  at: Date
  kg: number
  leanKg?: number
  fatKg?: number
}

export interface CompositionTrend {
  /** kg lost (negative) or gained over the window. */
  deltaKg: number
  /** Lean mass change when body-composition data exists, else null. */
  deltaLeanKg: number | null
  /** Share of weight *lost* that was lean mass (0–1) when computable. */
  leanShare: number | null
  /** Weekly rate of change in kg/week. */
  kgPerWeek: number
  days: number
}

export function compositionTrend(
  points: readonly WeightPoint[],
  windowDays: number,
): CompositionTrend | null {
  const sorted = points.toSorted((a, b) => a.at.getTime() - b.at.getTime())
  if (sorted.length < 2) return null
  const last = sorted[sorted.length - 1]!
  const cutoff = last.at.getTime() - windowDays * 86_400_000
  const first = sorted.find((p) => p.at.getTime() >= cutoff) ?? sorted[0]!
  if (first === last) return null
  const days = Math.max(1, (last.at.getTime() - first.at.getTime()) / 86_400_000)
  const deltaKg = last.kg - first.kg
  const deltaLeanKg =
    first.leanKg != null && last.leanKg != null ? last.leanKg - first.leanKg : null
  const leanShare =
    deltaLeanKg != null && deltaKg < 0 && deltaLeanKg < 0
      ? Math.min(1, -deltaLeanKg / -deltaKg)
      : deltaLeanKg != null && deltaKg < 0
        ? 0
        : null
  return { deltaKg, deltaLeanKg, leanShare, kgPerWeek: (deltaKg / days) * 7, days }
}

/** Weekly rate guidance: >1% body weight/week is considered aggressive for lean-mass retention. */
export function rateFlag(kgPerWeek: number, weightKg: number): 'ok' | 'fast' | 'gaining' {
  if (kgPerWeek > 0.1) return 'gaining'
  if (weightKg > 0 && -kgPerWeek / weightKg > 0.01) return 'fast'
  return 'ok'
}
