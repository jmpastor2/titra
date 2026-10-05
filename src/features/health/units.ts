/**
 * Body readings in the unit system the person chose (kg or lb, cm or in). Everything is
 * stored in metric; a screen converts at its edge with these, so the numbers, the trend
 * lines and the labels of one screen always agree. Pure apart from the hook.
 */
import { useMemo } from 'react'
import { usePatientScope } from '@/app/scope'
import type { MeasurementKind } from '@/data/database.types'
import { fmtFixed } from '@/features/quicklog/text'
import type { Locale } from '@/lib/format'
import { displayUnit, fromCanonical, KIND_DIGITS } from './kinds'

export interface BodyUnits {
  imperial: boolean
  /** The unit label of a kind in the person's system: "kg" or "lb", "cm" or "in". */
  unit: (kind: MeasurementKind) => string
  /** A stored (metric) amount as the person reads it. Unrounded, so maths on it stays exact. */
  show: (kind: MeasurementKind, stored: number) => number
}

export function bodyUnits(imperial: boolean): BodyUnits {
  return {
    imperial,
    unit: (kind) => displayUnit(kind, imperial),
    show: (kind, stored) => fromCanonical(kind, stored, imperial),
  }
}

/** The units of the account on screen (the patient's own, also in a shared, read-only view). */
export function useBodyUnits(): BodyUnits {
  const { patient } = usePatientScope()
  const imperial = patient?.unit_system === 'imperial'
  return useMemo(() => bodyUnits(imperial), [imperial])
}

/** A reading with the digits its kind always carries: 77,0 rather than 77. */
export function fmtReading(kind: MeasurementKind, value: number, locale: Locale): string {
  return fmtFixed(value, locale, KIND_DIGITS[kind])
}
