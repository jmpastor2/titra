import { formatDistanceStrict, formatRelative } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import type { TFunction } from 'i18next'
import type { SiteReason } from '@/domain/sites/rotation'
import type { Locale } from '@/lib/format'

const dfLocale = (l: Locale) => (l === 'es' ? es : enUS)

/** "hace 3 horas" / "3 hours ago", measured from `now` (not the wall clock). */
export function fmtAgo(at: Date, now: Date, locale: Locale): string {
  return formatDistanceStrict(at, now, {
    addSuffix: true,
    roundingMethod: 'floor',
    locale: dfLocale(locale),
  })
}

/** "mañana a las 8:00" / "Wednesday at 10:00 PM": the rest window is at most days away. */
export function fmtUntil(date: Date, now: Date, locale: Locale): string {
  return formatRelative(date, now, { locale: dfLocale(locale) })
}

/** One-line why for a ranked site: "Sin usar 5 días", "Usado hoy"… */
export function reasonText(t: TFunction, reason: SiteReason): string {
  switch (reason.kind) {
    case 'never':
      return t('sites.reason.never')
    case 'rested':
      return t('sites.reason.rested', { count: reason.days })
    case 'recent':
      // Whole hours: the rest rule is stated in hours (72 h) and chips are narrow.
      return t('sites.reason.recent', { ago: `${Math.floor(reason.hours)} h` })
    case 'today':
      return t('sites.reason.today')
  }
}
