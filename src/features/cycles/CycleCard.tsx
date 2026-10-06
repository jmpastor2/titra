import { Check, Repeat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Ring } from '@/components/kpi/Ring'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { ProtocolDecision } from '@/features/protocols/DecisionBand'
import type { UndoOffer } from '@/features/protocols/useUndoOffer'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { CompareBlock, CycleFigures } from './CycleFigures'
import { useCycleText } from './cycleText'
import { doseLabel } from './doseLabel'
import { sentence } from './format'
import { cycleCompoundIds, isCurrent, STATUS_TONE, type CycleView } from './model'
import { trailingRest } from './newCycle'
import { focusStep, phaseWeeks } from './phase'
import { PhaseStrip } from './PhaseStrip'
import { doseProgress, weekReadout } from './readout'
import { RestControls } from './RestControls'
import type { CycleEntry } from './useCyclesData'

/**
 * A cycle in progress: the ring and the week it is in, the dose now and when it changes, the
 * weeks of the cycle one by one (rest included), the decision when a step-up is close, how
 * the doses are going and, once the plan has run out, the way to the next cycle.
 */
export function CycleCard({
  entry,
  now,
  vials,
  statsState,
  imperial,
  canEdit,
  onNewCycle,
  onOpenStep,
  offerUndo,
}: {
  entry: CycleEntry
  now: Date
  vials: readonly InventoryRow[]
  statsState: 'pending' | 'ready' | 'error'
  imperial: boolean
  canEdit: boolean
  onNewCycle: (view: CycleView) => void
  /** Open one step of the cycle (the one in force, to start with). */
  onOpenStep: (view: CycleView, stepIndex: number) => void
  offerUndo: (offer: UndoOffer) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const { view, stats, comparison, canContinue, needsNext } = entry
  const { info, row } = view
  const color = compoundColor(row.compound_id)
  const readout = weekReadout(info, now)
  const ring = text.ring(readout)
  const deciding = canEdit && info.decisionDue
  const hasRest = isCurrent(row.status) && info.phase !== 'finished' && trailingRest(info) !== null

  const doseText = (doseMg: number) => {
    const l = doseLabel({ like: view.like, doseMg, vials, locale, withUnits: true })
    return l.units ? `${l.full} · ${l.units}` : l.full
  }
  const date = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  const nowDose = info.step && !info.step.pause ? doseText(info.step.doseMg) : null
  const next = info.next
  const nextLine = !next
    ? readout.kind === 'maintenance'
      ? t('cycles.noChange')
      : null
    : readout.kind === 'before'
      ? t('cycles.startsWith', { date: date(next.on), dose: doseText(next.doseMg ?? 0) })
      : text.change(next, next.doseMg ? doseText(next.doseMg) : null)

  return (
    <Card
      padded={false}
      className="overflow-hidden"
      style={{ borderColor: `color-mix(in oklab, ${color} 28%, var(--line))` }}
    >
      <div className="p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-1.5">
              <span className="flex shrink-0 items-center gap-1 pt-[9px]">
                {cycleCompoundIds(view).map((id) => (
                  <SubstanceDot key={id} color={compoundColor(id)} />
                ))}
              </span>
              <h3 className="break-words font-display text-[18px] font-semibold leading-snug">
                {row.name}
              </h3>
            </div>
            {view.siblings > 1 && (
              <div className="spec mt-1">{t('cycles.cycleN', { n: view.ordinal })}</div>
            )}
          </div>
          {row.status !== 'active' && (
            <Badge tone={STATUS_TONE[row.status]}>{t(`protocols.statuses.${row.status}`)}</Badge>
          )}
        </header>

        <div className="mt-4 flex items-center gap-4">
          <Ring
            value={doseProgress(info, now)}
            size={80}
            stroke={8}
            color={color}
            label={sentence(text.phrase(readout), locale)}
          >
            {readout.kind === 'finished' ? (
              <Check className="size-7 text-signal" strokeWidth={2.5} aria-hidden />
            ) : (
              <div className="text-center leading-none">
                <div className="readout text-[22px] font-semibold">{ring.main}</div>
                {ring.sub && <div className="spec mt-1 text-[9.5px]">{ring.sub}</div>}
              </div>
            )}
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="spec">{text.phaseLabel(readout, info.doseWeeks === null)}</div>
            <div className="mt-0.5 font-display text-[19px] font-semibold leading-tight">
              {sentence(text.phrase(readout), locale)}
            </div>
            {nowDose && (
              <div className="readout mt-1.5 text-[13px] text-ink">
                {t('cycles.now')} · {nowDose}
              </div>
            )}
            {nextLine && !deciding && (
              <div className="mt-0.5 text-[12.5px] text-muted">{nextLine}</div>
            )}
          </div>
        </div>

        <div className="mt-3.5">
          <PhaseStrip
            weeks={phaseWeeks(info, now)}
            color={color}
            name={row.name}
            onOpen={() => onOpenStep(view, focusStep(info, now))}
          />
        </div>

        {row.status === 'paused' && (
          <p className="mt-3 text-[12px] text-muted">{t('cycles.pausedNote')}</p>
        )}
      </div>

      {deciding && (
        <ProtocolDecision protocol={row} vials={vials} now={now} offerUndo={offerUndo} />
      )}

      {(stats || statsState !== 'ready' || hasRest) && (
        <div className="flex flex-col gap-3 p-4 pt-3.5">
          {(stats || statsState !== 'ready') && (
            <CycleFigures stats={stats} state={statsState} imperial={imperial} />
          )}
          <RestControls view={view} now={now} canEdit={canEdit} />
        </div>
      )}

      {comparison && <CompareBlock comparison={comparison} imperial={imperial} />}

      {canContinue && (
        <div className="border-t border-line px-4 py-3">
          {needsNext && (
            <p className="mb-2.5 text-[13px] text-ink-2">{t('cycles.new.finishedHint')}</p>
          )}
          <Button
            block
            variant={needsNext ? 'primary' : 'soft'}
            leading={<Repeat className="size-4" />}
            onClick={() => onNewCycle(view)}
          >
            {t('cycles.new.cta')}
          </Button>
        </div>
      )}
    </Card>
  )
}
