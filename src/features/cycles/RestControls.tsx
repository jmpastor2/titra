import { addDays } from 'date-fns'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { useToast } from '@/components/ui/Toast'
import { useSaveProtocol } from '@/data/hooks'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { isCurrent, type CycleView } from './model'
import { adjustRest, MAX_REST_WEEKS, REST_GUIDE, stepsUpdate, trailingRest } from './newCycle'
import { remaining, weekReadout } from './readout'

/**
 * The rest a cycle in progress ends in, planned or under way: how long it is and when it
 * ends, with a week more or less. The usual length is only a guide; nothing enforces it.
 * Nothing shows for a cycle that is over or has no timed rest.
 */
export function RestControls({
  view,
  now,
  canEdit,
}: {
  view: CycleView
  now: Date
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const save = useSaveProtocol(patientId)
  const rest =
    isCurrent(view.row.status) && view.info.phase !== 'finished' ? trailingRest(view.info) : null
  if (!rest) return null

  const weeks = rest.weeks
  const readout = weekReadout(view.info, now)
  const date = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  const left =
    readout.kind === 'rest' && readout.daysLeft !== null ? remaining(readout.daysLeft) : null
  const headline = left
    ? left.unit === 'weeks'
      ? t('cycles.rest.leftWeeks', { count: left.count })
      : t('cycles.rest.leftDays', { count: left.count })
    : t('cycles.rest.planned', { count: weeks })

  async function change(delta: number) {
    try {
      await save.mutateAsync(stepsUpdate(view.row, adjustRest(view.like.steps, delta)))
      toast(
        t('cycles.rest.saved', { count: Math.max(1, Math.min(MAX_REST_WEEKS, weeks + delta)) }),
        'success',
      )
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const stepper = (delta: number, label: string, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || save.isPending}
      onClick={() => void change(delta)}
      className="grid size-11 place-items-center rounded-full border border-line-strong bg-panel text-ink transition active:scale-95 disabled:opacity-40"
    >
      {delta < 0 ? <Minus className="size-4" /> : <Plus className="size-4" />}
    </button>
  )

  return (
    <div className="rounded-control border border-line bg-panel-2 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="spec">{t('cycles.rest.title')}</div>
          <div className="mt-0.5 text-[14.5px] font-semibold">{headline}</div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-1">
            {stepper(-1, t('cycles.rest.shorter'), weeks <= 1)}
            <span aria-live="polite" className="readout w-8 text-center text-[15px] font-semibold">
              {weeks}
            </span>
            {stepper(1, t('cycles.rest.longer'), weeks >= MAX_REST_WEEKS)}
          </div>
        )}
      </div>
      <div className="readout mt-1 text-[12px] text-muted">
        {t('cycles.rest.range', { from: date(rest.startsOn), to: date(addDays(rest.endsOn, -1)) })}
      </div>
      {canEdit && (
        <p className="mt-2 text-[11.5px] text-muted">
          {t('cycles.rest.guide', { min: REST_GUIDE.minWeeks, max: REST_GUIDE.maxWeeks })}
        </p>
      )}
    </div>
  )
}
