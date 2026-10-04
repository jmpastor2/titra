import { formatDistanceStrict } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import type { Locale } from '@/lib/format'

/**
 * "hace 3 días" / "3 days ago", measured from the card's own clock rather than the wall clock.
 * Within the last minute it says `justNow` instead of "0 seconds ago".
 */
export function fmtAgo(date: Date, now: Date, locale: Locale, justNow: string): string {
  if (Math.abs(now.getTime() - date.getTime()) < 60_000) return justNow
  return formatDistanceStrict(date, now, { locale: locale === 'es' ? es : enUS, addSuffix: true })
}
