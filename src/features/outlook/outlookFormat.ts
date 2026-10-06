/** How the "Futuro" screen writes weights, percentages, ranges and dates. */
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { fmtSignedFixed } from '@/features/health/progress'
import { fmtReading } from '@/features/health/units'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

const LB_PER_KG = 1 / 0.45359237

export function useFormat() {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const { patient } = usePatientScope()
  const imperial = patient?.unit_system === 'imperial'
  const pctSign = locale === 'es' ? ' %' : '%'
  const weightUnit = imperial ? 'lb' : 'kg'
  const toUnit = (kg: number) => (imperial ? kg * LB_PER_KG : kg)
  return {
    t,
    locale,
    pick,
    pct: (v: number, digits = 1) => `${fmtSignedFixed(v, locale, digits)}${pctSign}`,
    weight: (kg: number) => `${fmtReading('weight', toUnit(kg), locale)} ${weightUnit}`,
    weightDelta: (kg: number) => `${fmtSignedFixed(toUnit(kg), locale, 1)} ${weightUnit}`,
    range: (a: string, b: string) => (a === b ? a : t('outlook.range', { a, b })),
    date: (d: Date) => fmtDate(d, locale, 'd MMM yyyy'),
  }
}

export type Fmt = ReturnType<typeof useFormat>

/** "−7 % a −13 %", rounded for headlines, exact in details; always at one precision. */
export function bandText(f: Fmt, lower: number, upper: number, digits: number) {
  return f.range(f.pct(lower, digits), f.pct(upper, digits))
}
