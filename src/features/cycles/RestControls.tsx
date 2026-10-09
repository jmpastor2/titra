import { clsx } from 'clsx'
import { addDays } from 'date-fns'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { useToast } from '@/components/ui/Toast'
import { useSaveProtocol } from '@/data/hooks'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { isCurrent, type CycleView } from './model'
import { adjustRest, MAX_REST_WEEKS, restGuide, stepsUpdate, trailingRest } from './newCycle'
import { remaining, weekReadout } from './readout'

/**
 * The rest a cycle in progress ends in, planned or under way, as one row of the card: how
 * long it is and when, with a week more or less. The person's reference length is only a
 * guide; nothing enforces it. Nothing shows for a cycle that is over or has no timed rest.
 */
export function RestControls({
  view,
  now,
  canEdit,
  inset = true,
}: {
  view: CycleView
  now: Date
  canEdit: boolean
  /** A row of a card (its own side padding); off inside a sheet, which pads its body. */
  inset?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const save = useSaveProtocol(patientId)
  const rest =
    isCurrent(view.row.status) && view.info.phase !== 'finished' ? trailingRest(view.info) : null
  if (!rest) return null
  const guide = restGuide(view.row.notes)

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
      className="grid size-11 place-items-center rounded-full border border-line text-ink transition active:scale-95 disabled:opacity-40"
    >
      {delta < 0 ? <Minus className="size-4" /> : <Plus className="size-4" />}
    </button>
  )

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 border-t border-line py-3.5',
        inset ? 'px-4' : 'border-b',
      )}
    >
      <div className="min-w-0">
        <div className="spec">{t('cycles.rest.title')}</div>
        <div aria-live="polite" className="mt-0.5 text-[15px] font-semibold">
          {headline}
        </div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
          {t('cycles.rest.range', {
            from: date(rest.startsOn),
            to: date(addDays(rest.endsOn, -1)),
          })}
          {canEdit &&
            guide &&
            ` · ${t('cycles.rest.guideShort', { min: guide.minWeeks, max: guide.maxWeeks })}`}
        </div>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-1.5">
          {stepper(-1, t('cycles.rest.shorter'), weeks <= 1)}
          {stepper(1, t('cycles.rest.longer'), weeks >= MAX_REST_WEEKS)}
        </div>
      )}
    </div>
  )
}
