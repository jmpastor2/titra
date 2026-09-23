/**
 * Titra pharmacokinetic exposure engine.
 *
 * Model: one-compartment, first-order absorption, first-order elimination
 * (Bateman function) with linear superposition of doses. The engine reports
 * *systemic drug amount* ("fármaco a bordo", in mg) rather than concentration
 * because apparent volumes for many peptides are poorly characterised. When a
 * compound declares `apparentVolumeL`, concentration is derived as amount / V.
 *
 * This is an estimate for visualisation and education. It is not a dosing tool.
 *
 * Conventions: time in hours, amounts in mg. Pure functions, no I/O.
 */

import type { DoseEvent, PkParams } from '../types'

export const LN2 = Math.LN2
const HOUR_MS = 3_600_000

export interface RateConstants {
  /** Elimination rate constant (1/h). */
  ke: number
  /** Absorption rate constant (1/h); Infinity denotes a bolus. */
  ka: number
}

/** Convert half-life to first-order rate constant. */
export function halfLifeToKe(halfLifeH: number): number {
  if (!(halfLifeH > 0)) throw new RangeError('halfLifeH must be > 0')
  return LN2 / halfLifeH
}

/**
 * Single-dose time-to-peak for a Bateman profile. Symmetric in (ka, ke), which
 * is why "flip-flop" kinetics (ka < ke, typical of depot formulations) fall out
 * of the same expression.
 */
export function tmaxFor(ka: number, ke: number): number {
  if (!Number.isFinite(ka)) return 0
  if (Math.abs(ka - ke) < 1e-12) return 1 / ke
  return Math.log(ka / ke) / (ka - ke)
}

/**
 * Solve the absorption rate constant that reproduces an observed single-dose tmax.
 * tmax(ka) is strictly decreasing on (0, ∞): from +∞ down to 0. Bisection on log-scale.
 */
export function solveKa(tmaxH: number, ke: number): number {
  if (!(tmaxH > 0)) return Number.POSITIVE_INFINITY
  let lo = Math.log(ke * 1e-4)
  let hi = Math.log(ke * 1e6)
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const ka = Math.exp(mid)
    if (tmaxFor(ka, ke) > tmaxH) lo = mid
    else hi = mid
    if (hi - lo < 1e-12) break
  }
  return Math.exp((lo + hi) / 2)
}

export function rateConstants(pk: PkParams): RateConstants {
  const ke = halfLifeToKe(pk.halfLifeH)
  const ka = pk.tmaxH && pk.tmaxH > 0 ? solveKa(pk.tmaxH, ke) : Number.POSITIVE_INFINITY
  return { ke, ka }
}

/** Systemic amount at time t (hours) after a single dose D (mg). Returns 0 for t < 0. */
export function singleDoseAmount(doseMg: number, tH: number, { ka, ke }: RateConstants): number {
  if (tH < 0 || doseMg <= 0) return 0
  if (!Number.isFinite(ka)) return doseMg * Math.exp(-ke * tH)
  if (Math.abs(ka - ke) < 1e-9) return doseMg * ke * tH * Math.exp(-ke * tH)
  return (doseMg * ka * (Math.exp(-ke * tH) - Math.exp(-ka * tH))) / (ka - ke)
}

/** Amount still in the absorption depot (not yet systemic). */
export function depotAmount(doseMg: number, tH: number, { ka }: RateConstants): number {
  if (tH < 0 || doseMg <= 0 || !Number.isFinite(ka)) return 0
  return doseMg * Math.exp(-ka * tH)
}

export function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / HOUR_MS
}

/** Superposition of all doses administered at or before `at`. */
export function amountAt(doses: readonly DoseEvent[], at: Date, rc: RateConstants): number {
  let total = 0
  for (const d of doses) {
    const t = hoursBetween(d.at, at)
    if (t >= 0) total += singleDoseAmount(d.mg, t, rc)
  }
  return total
}

export interface CurvePoint {
  at: Date
  /** Systemic amount, mg. */
  mg: number
}

export interface CurveOptions {
  from: Date
  to: Date
  /** Grid step in hours. */
  stepH: number
  /** Include points right before and at each dose time so peaks are not smoothed away. */
  refineAtDoses?: boolean
}

/** Sample the superposed exposure curve on a regular grid. */
export function exposureCurve(
  doses: readonly DoseEvent[],
  pk: PkParams,
  opts: CurveOptions,
): CurvePoint[] {
  const rc = rateConstants(pk)
  const pts: CurvePoint[] = []
  const start = opts.from.getTime()
  const end = opts.to.getTime()
  const stepMs = Math.max(0.25, opts.stepH) * HOUR_MS
  const sorted = doses.toSorted((a, b) => a.at.getTime() - b.at.getTime())
  for (let ms = start; ms <= end; ms += stepMs) {
    const at = new Date(ms)
    pts.push({ at, mg: amountAt(sorted, at, rc) })
  }
  if (opts.refineAtDoses) {
    for (const d of sorted) {
      const ms = d.at.getTime()
      if (ms > start && ms < end) {
        const before = new Date(ms - 1)
        pts.push({ at: before, mg: amountAt(sorted, before, rc) })
        pts.push({ at: d.at, mg: amountAt(sorted, d.at, rc) })
      }
    }
    pts.sort((a, b) => a.at.getTime() - b.at.getTime())
  }
  return pts
}

export interface SteadyState {
  /** Average systemic amount over a dosing interval at steady state (mg). Independent of ka. */
  avgMg: number
  /** Peak within the interval (mg). */
  peakMg: number
  /** Trough just before the next dose (mg). */
  troughMg: number
  /** Time from dose to peak at steady state (h). */
  tPeakH: number
  /** Accumulation ratio: steady-state trough / single-dose amount at τ. */
  accumulationRatio: number
  /** Hours to reach 90% and 97% of steady state from a naive start. */
  hoursTo90: number
  hoursTo97: number
}

/** Steady-state amount at a given phase (hours since the last dose) for a regular regimen. */
export function steadyStateAtPhase(
  doseMg: number,
  intervalH: number,
  phaseH: number,
  pk: PkParams,
): number {
  const { ka, ke } = rateConstants(pk)
  const tau = intervalH
  const t = ((phaseH % tau) + tau) % tau
  const eKe = Math.exp(-ke * tau)
  if (!Number.isFinite(ka)) return (doseMg * Math.exp(-ke * t)) / (1 - eKe)
  const eKa = Math.exp(-ka * tau)
  return (
    ((doseMg * ka) / (ka - ke)) * (Math.exp(-ke * t) / (1 - eKe) - Math.exp(-ka * t) / (1 - eKa))
  )
}

/**
 * Steady-state metrics for a regular regimen: dose D every τ hours.
 * Standard one-compartment superposition (Gibaldi & Perrier, Pharmacokinetics, 2nd ed.).
 */
export function steadyState(doseMg: number, intervalH: number, pk: PkParams): SteadyState {
  const { ka, ke } = rateConstants(pk)
  const tau = intervalH
  const avgMg = doseMg / (ke * tau)
  const eKe = Math.exp(-ke * tau)
  let tPeakH = 0
  if (Number.isFinite(ka)) {
    const eKa = Math.exp(-ka * tau)
    tPeakH = Math.log((ka * (1 - eKe)) / (ke * (1 - eKa))) / (ka - ke)
    tPeakH = Math.min(Math.max(tPeakH, 0), tau)
  }
  const peakMg = steadyStateAtPhase(doseMg, tau, tPeakH, pk)
  // Phase τ wraps to 0 in steadyStateAtPhase; evaluate trough explicitly.
  const troughMg = Number.isFinite(ka)
    ? ((doseMg * ka) / (ka - ke)) *
      (Math.exp(-ke * tau) / (1 - eKe) - Math.exp(-ka * tau) / (1 - Math.exp(-ka * tau)))
    : (doseMg * eKe) / (1 - eKe)
  const single = singleDoseAmount(doseMg, tau, { ka, ke })
  const accumulationRatio = single > 0 ? troughMg / single : 1 / (1 - eKe)
  return {
    avgMg,
    peakMg,
    troughMg,
    tPeakH,
    accumulationRatio,
    hoursTo90: -Math.log(0.1) / ke,
    hoursTo97: -Math.log(0.03) / ke,
  }
}

export interface SteadyStateProgress {
  /** Current systemic amount, mg. */
  nowMg: number
  /** Theoretical steady-state amount at the same phase for the reference regimen, mg. */
  targetMg: number
  /** nowMg / targetMg, clamped to [0, 1.5]. >1 happens after a dose reduction. */
  fraction: number
  /** Hours until 90% of steady state under continued regular dosing (0 if reached). */
  hoursTo90: number
}

/**
 * How close the patient is to steady state for the *reference regimen*
 * (usually the current protocol step). Uses the actual dose history, so
 * irregular dosing and titration are handled naturally.
 */
export function steadyStateProgress(
  doses: readonly DoseEvent[],
  refDoseMg: number,
  refIntervalH: number,
  now: Date,
  pk: PkParams,
): SteadyStateProgress {
  const rc = rateConstants(pk)
  const sorted = [...doses]
    .filter((d) => d.at.getTime() <= now.getTime())
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
  const last = sorted.at(-1)
  const nowMg = amountAt(sorted, now, rc)
  const phaseH = last ? hoursBetween(last.at, now) : 0
  const targetMg = steadyStateAtPhase(refDoseMg, refIntervalH, phaseH, pk)
  const fraction = targetMg > 0 ? Math.min(Math.max(nowMg / targetMg, 0), 1.5) : 0
  // Remaining accumulation time assuming exponential approach 1 - e^(-ke t).
  const f = Math.min(fraction, 0.999)
  const hoursTo90 = f >= 0.9 ? 0 : (Math.log(1 - f) - Math.log(0.1)) / rc.ke
  return { nowMg, targetMg, fraction, hoursTo90 }
}

/** Hours until systemic amount decays to `fraction` of its post-absorption value (pure washout). */
export function washoutHours(fraction: number, pk: PkParams): number {
  if (!(fraction > 0 && fraction < 1)) throw new RangeError('fraction must be in (0,1)')
  return -Math.log(fraction) / halfLifeToKe(pk.halfLifeH)
}

/** Optional concentration conversion when the compound has an apparent volume. */
export function amountToConcentration(
  mg: number,
  pk: PkParams,
): { ngPerMl?: number; nmolPerL?: number } {
  if (!pk.apparentVolumeL || pk.apparentVolumeL <= 0) return {}
  const mgPerL = mg / pk.apparentVolumeL
  const out: { ngPerMl?: number; nmolPerL?: number } = { ngPerMl: mgPerL * 1000 }
  if (pk.molarMassGPerMol && pk.molarMassGPerMol > 0) {
    out.nmolPerL = (mgPerL / pk.molarMassGPerMol) * 1e6
  }
  return out
}
