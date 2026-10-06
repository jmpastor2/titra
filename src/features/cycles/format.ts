/**
 * Small formatters of the Ciclos screen that the shared ones in lib/format do not cover:
 * signed figures, body weight in the person's unit and a capitalised phrase. Pure.
 */
import { fmtNumber, type Locale } from '@/lib/format'

const LB_PER_KG = 1 / 0.45359237

/** "+2,1", "−3,4", "0": a real minus sign, and no sign for what rounds to zero. */
export function fmtSigned(value: number, locale: Locale, digits: number): string {
  const text = fmtNumber(Math.abs(value), locale, digits)
  if (text === fmtNumber(0, locale, digits)) return text
  return `${value > 0 ? '+' : '−'}${text}`
}

/** A change in body weight, stored in kg, in the unit the person uses: "−0,5" and "kg". */
export function weightDeltaParts(
  deltaKg: number,
  imperial: boolean,
  locale: Locale,
): { value: string; unit: string } {
  return {
    value: fmtSigned(imperial ? deltaKg * LB_PER_KG : deltaKg, locale, 1),
    unit: imperial ? 'lb' : 'kg',
  }
}

/** A change in body weight, stored in kg, in the unit the person uses: "−0,5 kg". */
export function fmtWeightDelta(deltaKg: number, imperial: boolean, locale: Locale): string {
  const { value, unit } = weightDeltaParts(deltaKg, imperial, locale)
  return `${value} ${unit}`
}

/** "semana 3 de 12" → "Semana 3 de 12". */
export function sentence(text: string, locale: Locale): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}
