import { addDays, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { fmtDate, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useCycleText } from './cycleText'
import { doseLabel } from './doseLabel'
import { isCurrent, cycleCompoundIds, type CycleView } from './model'
import { RestControls } from './RestControls'
import { stepWeeks } from './readout'
import { windowStats, type StatsInput } from './stats'
import { trailingRest } from './newCycle'
import { TextButton } from '@/features/doses/TextButton'

type StepState = 'past' | 'current' | 'future' | 'skipped'

const STATE_TONE = {
  past: 'neutral',
  current: 'brand',
  future: 'accent',
  skipped: 'neutral',
} as const

function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="readout min-w-0 text-right text-[14.5px] font-semibold">{children}</dd>
    </div>
  )
}

/**
 * One step of a cycle, from its weeks strip: its dates, the dose (with the syringe reading when a
 * vial says how to draw it) and how the doses of that stretch went.
 */
export function StepSheet({
  view,
  stepIndex,
  onClose,
  onStep,
  now,
  vials,
  input,
  canEdit,
}: {
  view: CycleView
  stepIndex: number
  onClose: () => void
  /** Go to another step of the same cycle. */
  onStep: (index: number) => void
  now: Date
  vials: readonly InventoryRow[]
  input: Omit<StatsInput, 'like'>
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const nav = useNavigate()
  const step = view.info.steps[stepIndex]
  if (!step) return null

  const today = startOfDay(now)
  const date = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  // The step stops where its cycle did, if that came first.
  const end =
    view.stopsOn && (!step.endsOn || view.stopsOn < step.endsOn) ? view.stopsOn : step.endsOn
  const state: StepState =
    view.stopsOn && step.startsOn >= view.stopsOn
      ? 'skipped'
      : end && end <= today
        ? 'past'
        : step.startsOn > today
          ? 'future'
          : 'current'

  const label = step.pause
    ? null
    : doseLabel({
        like: view.like,
        doseMg: step.doseMg,
        vials,
        locale,
        withUnits: state !== 'past' && isCurrent(view.row.status),
      })
  const range = stepWeeks(view.info.steps)[stepIndex]
  const stats =
    !step.pause && (state === 'past' || state === 'current')
      ? windowStats({ ...input, like: view.like }, step.startsOn, end && end < now ? end : now, {
          adherence: view.row.status !== 'paused',
        })
      : null
  const adherence = stats?.adherence && stats.adherence.expected > 0 ? stats.adherence : null
  const isTrailingRest = trailingRest(view.info)?.stepIndex === stepIndex

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {cycleCompoundIds(view).map((id) => (
            <SubstanceDot key={id} color={compoundColor(id)} size={9} />
          ))}
          <span className="min-w-0 break-words">{view.row.name}</span>
        </span>
      }
      description={t('cycles.step.of', { n: stepIndex + 1, count: view.info.stepCount })}
      // Steps differ in what they show: a fixed height, and the arrows in the footer, keep the
      // buttons under the thumb while paging through them.
      tall
      footer={
        view.info.stepCount > 1 ? (
          <div className="grid grid-cols-2 gap-2 pb-1">
            <Button
              variant="secondary"
              aria-label={t('cycles.step.previous')}
              disabled={stepIndex <= 0}
              leading={<ChevronLeft aria-hidden className="size-4 shrink-0" />}
              onClick={() => onStep(stepIndex - 1)}
            >
              {t('cycles.step.previousShort')}
            </Button>
            <Button
              variant="secondary"
              aria-label={t('cycles.step.next')}
              disabled={stepIndex >= view.info.stepCount - 1}
              trailing={<ChevronRight aria-hidden className="size-4 shrink-0" />}
              onClick={() => onStep(stepIndex + 1)}
            >
              {t('cycles.step.nextShort')}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5 pb-3 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-ink-2">
              {step.pause ? t('cycles.rest.title') : t('cycles.step.dose')}
            </div>
            <div className="readout mt-1 text-[28px] font-semibold leading-tight">
              {label ? label.full : t('cycles.step.noDoses')}
            </div>
            {label?.units && (
              <div className="readout text-[15px] font-semibold text-signal">{label.units}</div>
            )}
          </div>
          <Badge tone={STATE_TONE[state]} className="mt-0.5 shrink-0">
            {t(`cycles.step.state.${state}`)}
          </Badge>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Fact label={t('cycles.step.dates')}>
            {step.endsOn
              ? t('cycles.step.range', {
                  from: date(step.startsOn),
                  to: date(addDays(step.endsOn, -1)),
                })
              : t('cycles.step.since', { from: date(step.startsOn) })}
          </Fact>
          <Fact label={t('cycles.step.length')}>
            {step.weeks === null
              ? t('cycles.step.noEnd')
              : t('common.weeks', { count: step.weeks })}
          </Fact>
          {range?.from != null && (
            <Fact label={t('cycles.step.dosingWeeks')}>{text.weekRange(range.from, range.to)}</Fact>
          )}
          {adherence && (
            <Fact label={t('cycles.step.adherence')}>
              <span className={adherence.ratio >= 0.9 ? 'text-signal' : 'text-warn'}>
                {fmtPercent(adherence.ratio, locale)}
              </span>{' '}
              <span className="font-normal text-muted">
                {t('cycles.stat.ofDoses', { taken: adherence.taken, expected: adherence.expected })}
              </span>
            </Fact>
          )}
          {stats && stats.taken !== null && (
            <Fact label={t('cycles.stat.doses')}>{stats.taken}</Fact>
          )}
        </dl>

        {state === 'future' && !step.pause && (
          <p className="text-[12.5px] text-muted">{t('cycles.step.notStarted')}</p>
        )}
        {state === 'skipped' && (
          <p className="text-[12.5px] text-muted">{t('cycles.step.skipped')}</p>
        )}

        {isTrailingRest && <RestControls view={view} now={now} canEdit={canEdit} inset={false} />}

        {canEdit && (
          <TextButton
            className="-ml-3 self-start"
            icon={<Pencil aria-hidden className="size-4" />}
            onClick={() => nav(`/protocols/${view.row.id}/edit`)}
          >
            {t('cycles.step.edit')}
          </TextButton>
        )}
      </div>
    </Sheet>
  )
}
