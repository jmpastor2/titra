import { useTranslation } from 'react-i18next'
import { Field, Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { fmtDate, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

export type WhenMode = 'now' | 'planned' | 'custom'

/**
 * When the dose was taken: now, at the planned time of the administration it was opened for
 * (only when that is already past), or another date and time.
 */
export function WhenField({
  mode,
  onMode,
  plannedAt,
  openedAt,
  date,
  time,
  onDate,
  onTime,
}: {
  mode: WhenMode
  onMode: (mode: WhenMode) => void
  /** The planned time of the administration being logged. */
  plannedAt: Date | undefined
  /** When the form opened, in ms: "at its time" is offered when the plan is before it. */
  openedAt: number
  date: string
  time: string
  onDate: (date: string) => void
  onTime: (time: string) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  const atPlanned =
    plannedAt && plannedAt.getTime() < openedAt
      ? [
          {
            value: 'planned' as const,
            label: t('doses.atPlanned', {
              // A 01:00 night shot reads as the evening it belongs to.
              time: `${
                plannedAt.getHours() < 6
                  ? t('doses.nightOf', {
                      day: fmtDate(new Date(plannedAt.getTime() - 86_400_000), locale, 'EEE'),
                    })
                  : fmtDate(plannedAt, locale, 'EEE')
              } ${toTimeInputValue(plannedAt)}`,
            }),
          },
        ]
      : []

  return (
    <Field label={t('doses.when')}>
      {() => (
        <div className="flex flex-col gap-2">
          <Segmented<WhenMode>
            value={mode}
            onChange={onMode}
            size="sm"
            options={[
              { value: 'now', label: t('doses.now') },
              ...atPlanned,
              { value: 'custom', label: t('doses.otherTime') },
            ]}
          />
          {mode === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                aria-label={t('common.date')}
                value={date}
                onChange={(e) => onDate(e.target.value)}
              />
              <Input
                type="time"
                aria-label={t('common.time')}
                value={time}
                onChange={(e) => onTime(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </Field>
  )
}
