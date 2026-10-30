import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { toDateInputValue, toTimeInputValue } from '@/lib/format'
import { SheetSection } from './SheetSection'

export type WhenMode = 'now' | 'planned' | 'custom'

/**
 * When the dose was taken: now, at the planned time of the administration it was opened for
 * (only when that is already past), or another date and time. The date and time it will be
 * saved with are always on show, so switching never reshapes the form; touching them, or
 * "Otra hora", starts from what is shown (its planned time, to fix a few minutes).
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
  const canPlan = plannedAt !== undefined && plannedAt.getTime() < openedAt

  const fixed =
    mode === 'now' ? new Date(openedAt) : mode === 'planned' && plannedAt ? plannedAt : null
  const shownDate = fixed ? toDateInputValue(fixed) : date
  const shownTime = fixed ? toTimeInputValue(fixed) : time

  function custom(next: { date?: string; time?: string }) {
    onDate(next.date ?? shownDate)
    onTime(next.time ?? shownTime)
    onMode('custom')
  }

  return (
    <SheetSection label={t('doses.when')}>
      <Segmented<WhenMode>
        value={mode}
        onChange={(m) => (m === 'custom' ? custom({}) : onMode(m))}
        size="sm"
        options={[
          { value: 'now', label: t('doses.now') },
          ...(canPlan ? [{ value: 'planned' as const, label: t('doses.atPlanned') }] : []),
          { value: 'custom', label: t('doses.otherTime') },
        ]}
      />
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
        <Input
          type="date"
          aria-label={t('common.date')}
          value={shownDate}
          onChange={(e) => custom({ date: e.target.value })}
        />
        <Input
          type="time"
          aria-label={t('common.time')}
          value={shownTime}
          onChange={(e) => custom({ time: e.target.value })}
        />
      </div>
    </SheetSection>
  )
}
