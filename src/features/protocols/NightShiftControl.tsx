import { isValid, parseISO } from 'date-fns'
import { Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Segmented } from '@/components/ui/primitives'
import { useLocale } from '@/lib/useLocale'
import { WEEK, type Draft } from './draft'

/**
 * Shown when a time falls in the small hours (before 06:00): is it the night of the day
 * before (a 01:00 shot after the Monday evening is Monday's) or really that morning? With
 * the plain example under it, so nobody has to work out "25:00".
 */
export function NightShiftControl({
  draft,
  onChange,
}: {
  draft: Pick<Draft, 'times' | 'nightShift' | 'mode' | 'weekdays' | 'startDate'>
  onChange: (nightShift: boolean) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const early = draft.times.find((x) => Number(x.split(':')[0]) < 6)
  if (!early) return null

  // The day the example talks about: the first day of the week that is planned.
  const start = parseISO(draft.startDate)
  const day =
    draft.mode === 'weekdays'
      ? (WEEK.find((d) => draft.weekdays.includes(d)) ?? 1)
      : isValid(start)
        ? start.getDay()
        : 1
  const name = (d: number) =>
    new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' }).format(
      new Date(2026, 2, 1 + (d % 7)), // 2026-03-01 is a Sunday
    )

  return (
    <div className="mt-3 rounded-control border border-line bg-panel-2 p-3.5">
      <div className="flex items-center gap-2 text-[14px] font-semibold">
        <Moon aria-hidden className="size-4 shrink-0 text-accent" />
        {t('protocols.nightShift')}
      </div>
      <Segmented<'night' | 'same'>
        className="mt-2.5"
        value={draft.nightShift ? 'night' : 'same'}
        onChange={(v) => onChange(v === 'night')}
        options={[
          { value: 'night', label: t('protocols.night.optNight') },
          { value: 'same', label: t('protocols.night.optSame') },
        ]}
      />
      <p className="mt-2.5 text-[12.5px] leading-snug text-ink-2">
        {draft.nightShift
          ? t('protocols.night.exampleNight', { day: name(day), next: name(day + 1), time: early })
          : t('protocols.night.exampleSame', { day: name(day), time: early })}
      </p>
      <p className="mt-1 text-[12px] leading-snug text-muted">{t('protocols.nightShiftHint')}</p>
    </div>
  )
}
