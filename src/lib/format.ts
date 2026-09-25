import { format as dfFormat, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import type { DoseUnit } from '@/domain/types'

export type Locale = 'es' | 'en'

const dfLocale = (l: Locale) => (l === 'es' ? es : enUS)
const intlLocale = (l: Locale) => (l === 'es' ? 'es-ES' : 'en-US')

export function fmtNumber(value: number, locale: Locale, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: maxFractionDigits,
  }).format(value)
}

const DOSE_LABEL: Record<DoseUnit, string> = {
  mcg: 'mcg',
  iu: 'UI',
  units: 'U',
  ml: 'mL',
  mg: 'mg',
}

/** The number part of fmtDose: 250 for 0.25 mg shown in mcg. */
export function fmtDoseValue(valueMg: number, unit: DoseUnit, locale: Locale): string {
  switch (unit) {
    case 'mcg':
      return fmtNumber(valueMg * 1000, locale, 0)
    case 'iu':
      return fmtNumber(valueMg, locale, 0)
    case 'units':
      return fmtNumber(valueMg, locale, 1)
    case 'ml':
      return fmtNumber(valueMg, locale, 2)
    case 'mg':
    default:
      return fmtNumber(valueMg, locale, valueMg < 1 ? 3 : 2)
  }
}

/** Smart dose formatting: 0.25 mg, 250 mcg, 10 U. */
export function fmtDose(valueMg: number, unit: DoseUnit, locale: Locale): string {
  return `${fmtDoseValue(valueMg, unit, locale)} ${DOSE_LABEL[unit] ?? 'mg'}`
}

/** Several doses in one line: "100 + 100 mcg" when they share a unit, else "2 mg · 100 mcg". */
export function fmtDoseList(
  doses: readonly { valueMg: number; unit: DoseUnit }[],
  locale: Locale,
): string {
  const first = doses[0]
  if (first && doses.length > 1 && doses.every((d) => d.unit === first.unit)) {
    const values = doses.map((d) => fmtDoseValue(d.valueMg, d.unit, locale)).join(' + ')
    return `${values} ${DOSE_LABEL[first.unit] ?? 'mg'}`
  }
  return doses.map((d) => fmtDose(d.valueMg, d.unit, locale)).join(' · ')
}

export function fmtPercent(fraction: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'percent',
    maximumFractionDigits: digits,
  }).format(fraction)
}

export function fmtDate(date: Date, locale: Locale, pattern = 'd MMM yyyy'): string {
  return dfFormat(date, pattern, { locale: dfLocale(locale) })
}

export function fmtDateTime(date: Date, locale: Locale): string {
  return dfFormat(date, locale === 'es' ? 'd MMM, HH:mm' : 'MMM d, h:mm a', {
    locale: dfLocale(locale),
  })
}

export function fmtRelativeDay(date: Date, locale: Locale): string {
  if (isToday(date)) return locale === 'es' ? 'Hoy' : 'Today'
  if (isYesterday(date)) return locale === 'es' ? 'Ayer' : 'Yesterday'
  return fmtDate(date, locale, 'EEE d MMM')
}

export function fmtDistance(date: Date, locale: Locale): string {
  return formatDistanceToNowStrict(date, { locale: dfLocale(locale), addSuffix: true })
}

/** Hours → "3 d 4 h" / "5 h". */
export function fmtHours(hours: number, locale: Locale): string {
  const h = Math.max(0, Math.round(hours))
  const days = Math.floor(h / 24)
  const rem = h % 24
  const d = locale === 'es' ? 'd' : 'd'
  if (days === 0) return `${rem} h`
  if (rem === 0) return `${days} ${d}`
  return `${days} ${d} ${rem} h`
}

export function toDateInputValue(date: Date): string {
  return dfFormat(date, 'yyyy-MM-dd')
}

export function toTimeInputValue(date: Date): string {
  return dfFormat(date, 'HH:mm')
}

export function fromDateTimeInputs(date: string, time: string): Date {
  return new Date(`${date}T${time || '09:00'}:00`)
}
