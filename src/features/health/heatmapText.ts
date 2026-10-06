/** What the adherence calendar says about a day in words. */
import type { TFunction } from 'i18next'
import { fmtDate, type Locale } from '@/lib/format'
import type { HeatCell } from './heatmap'

/** What a day says: its date and how many of its doses were taken. */
export function describeCell(cell: HeatCell, locale: Locale, t: TFunction): string {
  const date = fmtDate(cell.day, locale, locale === 'es' ? 'EEE d MMM' : 'EEE, MMM d')
  if (cell.future) return t('progress.consistency.dayFuture', { date })
  if (cell.expected === 0) return t('progress.consistency.dayNone', { date })
  return t('progress.consistency.dayTaken', {
    date,
    taken: Math.min(cell.taken, cell.expected),
    expected: cell.expected,
  })
}
