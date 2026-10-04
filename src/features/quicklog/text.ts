/**
 * Small text helpers of the Registro rápido: fixed-digit numbers for readouts that must not
 * change width while stepping, and "hace 2 días". See text.test.ts.
 */
import type { TFunction } from 'i18next'
import type { Locale } from '@/lib/format'
import { daysAgo } from './readings'

/** 77,0 rather than 77: every reading of a kind keeps the same number of digits. */
export function fmtFixed(value: number, locale: Locale, digits: number): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export type AgoUnit = 'today' | 'yesterday' | 'days' | 'weeks' | 'months'

/** How long ago, in the unit a person would say it: 3 days, 2 weeks, 4 months. */
export function agoParts(days: number): { unit: AgoUnit; count: number } {
  if (days <= 0) return { unit: 'today', count: 0 }
  if (days === 1) return { unit: 'yesterday', count: 1 }
  if (days < 14) return { unit: 'days', count: days }
  if (days < 60) return { unit: 'weeks', count: Math.floor(days / 7) }
  return { unit: 'months', count: Math.floor(days / 30) }
}

/** "hoy", "ayer", "hace 3 días", "hace 2 sem"… */
export function agoLabel(t: TFunction, at: Date, now: Date): string {
  const { unit, count } = agoParts(daysAgo(at, now))
  return t(`quick.ago.${unit}`, { count })
}
