/**
 * Fast-entry maths for the measurement steppers: step size, plausible range and rounding
 * in the units the person sees (kg or lb, cm or in), conversion to the metric storage
 * unit, parsing of what they type and the long-press repeat schedule. Pure; see
 * stepper.test.ts.
 */
import type { MeasurementKind } from '@/data/database.types'
import { KIND_DIGITS, toCanonical } from '@/features/health/kinds'

export interface StepSpec {
  /** What one tap adds or removes, in display units. */
  step: number
  /** Fraction digits shown and kept. */
  digits: number
  /** Plausible range in display units. A typo guard (777 kg), not a clinical threshold. */
  min: number
  max: number
}

interface Base {
  step: number
  /** Imperial step when it differs from the metric one (0.2 lb is about 0.1 kg). */
  imperialStep?: number
  /** Range in storage (metric) units. */
  min: number
  max: number
  digits?: number
}

const SCORE: Base = { step: 1, min: 0, max: 10 }

const BASES: Record<MeasurementKind, Base> = {
  weight: { step: 0.1, imperialStep: 0.2, min: 20, max: 400 },
  lean_mass: { step: 0.1, imperialStep: 0.2, min: 10, max: 250 },
  waist: { step: 0.5, imperialStep: 0.2, min: 40, max: 250 },
  hip: { step: 0.5, imperialStep: 0.2, min: 50, max: 250 },
  chest: { step: 0.5, imperialStep: 0.2, min: 50, max: 250 },
  arm: { step: 0.5, imperialStep: 0.2, min: 10, max: 80 },
  thigh: { step: 0.5, imperialStep: 0.2, min: 20, max: 120 },
  body_fat_pct: { step: 0.1, min: 2, max: 70 },
  bp_systolic: { step: 1, min: 50, max: 260 },
  bp_diastolic: { step: 1, min: 30, max: 160 },
  heart_rate: { step: 1, min: 25, max: 250 },
  glucose_fasting: { step: 1, min: 20, max: 600 },
  glucose_random: { step: 1, min: 20, max: 600 },
  hba1c: { step: 0.1, min: 3, max: 18 },
  steps: { step: 500, min: 0, max: 100_000 },
  protein_g: { step: 5, min: 1, max: 400 },
  resistance_session: { step: 5, min: 5, max: 300 },
  sleep_hours: { step: 0.5, min: 0.5, max: 24 },
  hydration_ml: { step: 50, min: 50, max: 5000 },
  energy: SCORE,
  sleep_quality: SCORE,
  mood: SCORE,
  recovery: SCORE,
  libido: SCORE,
  appetite: SCORE,
  focus: SCORE,
}

/**
 * Round half away from zero to `digits` fraction digits, going through the decimal text
 * so 1.005 gives 1.01 and 0.1 + 0.2 gives 0.3.
 */
export function roundTo(value: number, digits: number): number {
  // Below a millionth is noise (and would print in exponent form).
  if (!Number.isFinite(value) || Math.abs(value) < 1e-6) return 0
  const shifted = Math.round(Number(`${Math.abs(value)}e${digits}`))
  return Math.sign(value) * Number(`${shifted}e-${digits}`)
}

/** Storage units in one display unit: 0.4536 kg to the pound, 2.54 cm to the inch. */
const perDisplayUnit = (kind: MeasurementKind, imperial: boolean) => toCanonical(kind, 1, imperial)

/** Storage (metric) value to what the person sees: kg to lb, cm to in. */
export function toDisplay(kind: MeasurementKind, stored: number, imperial: boolean): number {
  return roundTo(stored / perDisplayUnit(kind, imperial), digitsFor(kind))
}

/**
 * The change between two stored readings in display units, rounded once: taking the
 * difference of two rounded readings would add up their rounding.
 */
export function changeBetween(
  kind: MeasurementKind,
  from: number,
  to: number,
  imperial: boolean,
): number {
  return roundTo((to - from) / perDisplayUnit(kind, imperial), digitsFor(kind))
}

/** What the person typed or stepped to, as the value to store (2 digits is plenty). */
export function toStored(kind: MeasurementKind, display: number, imperial: boolean): number {
  return roundTo(toCanonical(kind, display, imperial), 2)
}

function digitsFor(kind: MeasurementKind): number {
  return BASES[kind].digits ?? KIND_DIGITS[kind]
}

export function stepSpec(kind: MeasurementKind, imperial: boolean): StepSpec {
  const b = BASES[kind]
  const digits = digitsFor(kind)
  return {
    step: imperial && b.imperialStep ? b.imperialStep : b.step,
    digits,
    min: toDisplay(kind, b.min, imperial),
    max: toDisplay(kind, b.max, imperial),
  }
}

export function clampTo(spec: StepSpec, value: number): number {
  return roundTo(Math.min(spec.max, Math.max(spec.min, value)), spec.digits)
}

export function inRange(spec: StepSpec, value: number): boolean {
  return Number.isFinite(value) && value >= spec.min && value <= spec.max
}

/** One tap (or `multiplier` taps, when a long press has picked up speed). */
export function stepValue(
  spec: StepSpec,
  value: number,
  direction: 1 | -1,
  multiplier = 1,
): number {
  return clampTo(spec, value + direction * spec.step * multiplier)
}

/**
 * What the person typed, accepting a decimal comma or point. With no fraction digits
 * ("10.000", "10,000") the separators are thousands marks. Null when it is not a number.
 */
export function parseNumber(text: string, digits: number): number | null {
  const s = text.trim().replace(/\s/g, '')
  if (!s) return null
  const normalised = digits === 0 ? s.replace(/[.,]/g, '') : s.replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(normalised)) return null
  return Number(normalised)
}

/** Difference to the previous reading, rounded to what is shown; 0 when it rounds away. */
export function deltaFrom(value: number, previous: number, digits: number): number {
  const d = roundTo(value - previous, digits)
  return d === 0 ? 0 : d
}

/** Long press: how soon the next repeat comes and how many steps it is worth. */
export const HOLD_MS = 380

export function repeatStep(repeats: number): { delayMs: number; multiplier: number } {
  const delayMs = repeats < 5 ? 150 : repeats < 12 ? 100 : 70
  const multiplier = repeats < 14 ? 1 : repeats < 28 ? 5 : 10
  return { delayMs, multiplier }
}
