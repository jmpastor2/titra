import { clsx } from 'clsx'
import { addDays } from 'date-fns'
import { Check, ChevronDown, Pencil } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, InventoryRow } from '@/data/database.types'
import { toDoseEvent, toProtocolLike } from '@/data/mappers'
import type { CycleStep } from '@/domain/dosing/cycle'
import { adherence } from '@/domain/dosing/schedule'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { doseDetail, doseMain, stepDose } from './dose'
import { protocolDoses, type ProtocolCycle } from './items'
import { SubstanceDots } from './SubstanceDots'
import { headlineText, inDaysText, nextText, protocolTitle } from './text'
import { headline, nextLine, stepState, weekTrack, type TrackState } from './view'
import { WeekTrack } from './WeekTrack'

const DAY_MS = 86_400_000

/**
 * One protocol's cycle on one compact row: which week of how many, the week track, the dose
 * now and the next change. Tapping it opens the plan's steps. `urgent` lights the next change
 * (a decision is waiting for it).
 */
export function CycleRow({
  cycle,
  vials,
  doses,
  now,
  expanded,
  onToggle,
  urgent,
  canEdit,
}: {
  cycle: ProtocolCycle
  vials: readonly InventoryRow[]
  doses: readonly DoseRow[]
  now: Date
  expanded: boolean
  onToggle: () => void
  urgent: boolean
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const panelId = useId()
  const { protocol, info } = cycle
  const pl = useMemo(() => toProtocolLike(protocol), [protocol])
  const unit = compoundById(protocol.compound_id)?.defaultUnit ?? 'mg'
  const color = compoundColor(protocol.compound_id)
  const track = useMemo(() => weekTrack(info), [info])

  const head = headlineText(headline(info), t, locale)
  const next = nextLine(info)
  const nextWords = nextText(
    next,
    (s) => doseMain(stepDose(pl, vials, s.doseMg), unit, locale),
    t,
    locale,
  )
  const doseNow = info.step && !info.step.pause ? stepDose(pl, vials, info.step.doseMg) : null

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
        onClick={onToggle}
        className="-mx-1 block w-[calc(100%+0.5rem)] rounded-xl px-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60 active:bg-panel-2"
      >
        <span className="flex items-center gap-2">
          <SubstanceDots protocol={protocol} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-2">
            {protocolTitle(protocol)}
          </span>
          <ChevronDown
            aria-hidden
            className={clsx(
              'size-4 shrink-0 text-muted transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </span>
        <span className="mt-1 block font-display text-[19px] font-bold leading-tight">{head}</span>
        <WeekTrack cells={track} color={color} className="mt-2.5" />
        <span className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {doseNow ? (
            <span className="readout flex items-baseline gap-1.5">
              <span className="sr-only">{t('cycle.doseNow')}</span>
              <span className="text-[15px] font-semibold text-signal">
                {doseMain(doseNow, unit, locale)}
              </span>
              <span className="text-[12px] text-muted">{doseDetail(doseNow, unit, locale)}</span>
            </span>
          ) : info.phase === 'rest' ? (
            <span className="text-[12.5px] text-muted">{t('cycle.noDose')}</span>
          ) : null}
          <span
            className={clsx('text-[12.5px]', urgent ? 'font-semibold text-warn' : 'text-ink-2')}
          >
            {nextWords}
            {'days' in next && <span className="text-muted"> · {inDaysText(next.days, t)}</span>}
          </span>
        </span>
      </button>

      {expanded && (
        <Detail
          id={panelId}
          cycle={cycle}
          vials={vials}
          doses={doses}
          now={now}
          canEdit={canEdit}
        />
      )}
    </li>
  )
}

function StepMark({ state, rest, color }: { state: TrackState; rest: boolean; color: string }) {
  if (state === 'done')
    return <Check aria-hidden className="size-3.5 text-signal" strokeWidth={3} />
  const edge = `color-mix(in oklab, ${color} 60%, transparent)`
  return (
    <span
      aria-hidden
      className="block size-2.5 justify-self-center rounded-full"
      style={
        state === 'current'
          ? { background: color, boxShadow: `0 0 8px ${edge}` }
          : { border: `1.5px ${rest ? 'dashed' : 'solid'} ${edge}` }
      }
    />
  )
}

/** The plan's steps with the dose of each, where you are, and how this step has gone. */
function Detail({
  id,
  cycle: { protocol, info },
  vials,
  doses,
  now,
  canEdit,
}: {
  id: string
  cycle: ProtocolCycle
  vials: readonly InventoryRow[]
  doses: readonly DoseRow[]
  now: Date
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const pl = useMemo(() => toProtocolLike(protocol), [protocol])
  const unit = compoundById(protocol.compound_id)?.defaultUnit ?? 'mg'
  const color = compoundColor(protocol.compound_id)

  // How many of the administrations planned since this step began were taken.
  const step = info.step
  const stepAdherence = useMemo(() => {
    if (!step || step.pause) return null
    const history = protocolDoses(protocol, doses).map(toDoseEvent)
    const days = (now.getTime() - step.startsOn.getTime()) / DAY_MS
    return days > 0 ? adherence(pl, history, now, days) : null
  }, [step, protocol, doses, pl, now])

  const range = (s: CycleStep) =>
    s.endsOn
      ? t('cycle.detail.range', {
          from: fmtDate(s.startsOn, locale, 'd MMM'),
          to: fmtDate(addDays(s.endsOn, -1), locale, 'd MMM'),
        })
      : t('cycle.detail.onwards', { from: fmtDate(s.startsOn, locale, 'd MMM') })

  return (
    <div id={id} className="fade-up mt-3 rounded-control border border-line bg-panel-2 p-3">
      <div className="spec mb-2">{t('cycle.detail.ladder')}</div>
      <ol className="flex flex-col gap-1">
        {info.steps.map((s) => {
          const state = stepState(info, s.index)
          const dose = s.pause ? null : stepDose(pl, vials, s.doseMg)
          return (
            <li
              key={s.index}
              aria-current={state === 'current' ? 'step' : undefined}
              className={clsx(
                'grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl border px-2.5 py-2',
                state === 'current' ? 'border-signal/30 bg-signal-soft' : 'border-transparent',
                state === 'done' && 'opacity-70',
              )}
            >
              <StepMark state={state} rest={s.pause} color={color} />
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                {dose ? (
                  <span className="readout flex items-baseline gap-1.5">
                    <span className="text-[13.5px] font-semibold">
                      {doseMain(dose, unit, locale)}
                    </span>
                    <span className="text-[11.5px] text-muted">
                      {doseDetail(dose, unit, locale)}
                    </span>
                  </span>
                ) : (
                  <span className="text-[13px] font-semibold text-ink-2">
                    {t('cycle.detail.rest')}
                  </span>
                )}
                {state === 'current' && <Badge tone="brand">{t('cycle.detail.here')}</Badge>}
              </span>
              <span className="text-right">
                <span className="readout block text-[11px] text-ink-2">{range(s)}</span>
                {s.weeks !== null && (
                  <span className="block text-[10.5px] text-muted">
                    {t('common.weeks', { count: s.weeks })}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      {stepAdherence && stepAdherence.expected > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-[12.5px]">
          <span className="text-muted">{t('cycle.detail.adherence')}</span>
          <span className="readout font-semibold">
            {t('cycle.detail.adherenceValue', {
              taken: stepAdherence.taken,
              planned: stepAdherence.expected,
            })}
          </span>
        </div>
      )}

      {canEdit && (
        <Link
          to={`/protocols/${protocol.id}/edit`}
          className="spec -mb-1 mt-2 inline-flex min-h-11 items-center gap-1.5 text-signal"
        >
          <Pencil aria-hidden className="size-3" />
          {t('cycle.detail.edit')}
        </Link>
      )}
    </div>
  )
}
