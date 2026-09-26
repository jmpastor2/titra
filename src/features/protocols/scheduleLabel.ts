import { useTranslation } from 'react-i18next'
import { splitNightTime } from '@/domain/dosing/schedule'
import type { ScheduleStep } from '@/domain/types'
import { useLocale } from '@/lib/useLocale'

/** "L–V · 22:00" / "cada 7 d · 09:00" */
export function useScheduleLabel() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const narrow = (d: number) =>
    new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'narrow' })
      .format(new Date(2026, 2, 1 + d))
      .toUpperCase()
  return (steps: readonly ScheduleStep[], times: readonly string[]) => {
    const s = steps.find((x) => !x.pause)
    if (!s) return '—'
    let days: string
    if (s.weekdays?.length) {
      const set = [...s.weekdays].toSorted((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
      days =
        set.length === 7
          ? t('protocols.daily')
          : set.join(',') === '1,2,3,4,5'
            ? `${narrow(1)}–${narrow(5)}`
            : set.map(narrow).join(' ')
    } else if (s.intervalDays === 1) days = t('protocols.daily')
    else if (s.intervalDays === 7) days = t('protocols.weekly')
    else days = t('protocols.everyNDays', { n: s.intervalDays })
    return `${days} · ${times
      .map((x) => {
        const { clock, nextDay } = splitNightTime(x)
        return nextDay ? `${clock} ☾` : clock
      })
      .join(' / ')}`
  }
}
