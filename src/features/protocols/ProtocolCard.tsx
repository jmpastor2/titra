import { addDays } from 'date-fns'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Ring } from '@/components/kpi/Ring'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow, ProtocolRow, ProtocolStatus } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import { useCycleText as useRingText } from '@/features/cycles/cycleText'
import { doseProgress, weekReadout } from '@/features/cycles/readout'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useCycleText } from './cycleText'
import { fmtDoseView } from './cycleView'
import { DecisionBand } from './DecisionBand'
import { NextChange } from './NextChange'
import { CardActions } from './ProtocolButtons'
import { ProtocolSheets } from './ProtocolSheets'
import { useScheduleLabel } from './scheduleLabel'
import { useProtocolActions } from './useProtocolActions'
import type { UndoOffer } from './useUndoOffer'

const STATUS_TONE: Record<ProtocolStatus, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  paused: 'warn',
  completed: 'neutral',
  archived: 'neutral',
}

/**
 * One protocol on the list. The dose now is the hero (in syringe units when the vial is
 * known), the ring says which week of the cycle it is, one line says when the dose steps
 * up, and Edit and "⋯" are always in reach. A decision, when it is due, sits under it.
 */
export function ProtocolCard({
  p,
  vials,
  now,
  canEdit,
  offerUndo,
}: {
  p: ProtocolRow
  vials: readonly InventoryRow[]
  now: Date
  canEdit: boolean
  offerUndo: (offer: UndoOffer) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  const text = useCycleText()
  const ringText = useRingText()
  const scheduleLabel = useScheduleLabel()
  const actions = useProtocolActions({ protocol: p, vials, now, offerUndo })
  const { pl, summary } = actions
  const ids = protocolCompoundIds(p)
  const primaryColor = compoundColor(p.compound_id)
  const current = p.status === 'active' || p.status === 'paused'

  const dose = summary?.dose ? fmtDoseView(summary.dose, locale) : null
  const readout = summary ? weekReadout(summary.info, now) : null
  const ring = readout ? ringText.ring(readout) : null
  const deciding = canEdit && Boolean(actions.hold && summary?.info.decisionDue)

  return (
    <Card
      padded={false}
      className="overflow-hidden"
      style={{ borderColor: `color-mix(in oklab, ${primaryColor} 28%, var(--line))` }}
    >
      <button
        type="button"
        onClick={() => nav(`/protocols/${p.id}`)}
        className="block w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-1.5">
              <span className="flex shrink-0 items-center gap-1 pt-[9px]">
                {ids.map((id) => (
                  <SubstanceDot key={id} color={compoundColor(id)} />
                ))}
              </span>
              <span className="break-words font-display text-[19px] font-semibold leading-snug">
                {p.name}
              </span>
            </div>
            <div className="readout mt-0.5 text-[12.5px] text-muted">
              {scheduleLabel(pl.steps, pl.times)}
            </div>
          </div>
          {p.status !== 'active' && (
            <Badge tone={STATUS_TONE[p.status]}>{t(`protocols.statuses.${p.status}`)}</Badge>
          )}
        </div>

        {current && summary && readout && ring ? (
          <>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="spec">
                  {ringText.phaseLabel(readout, summary.info.doseWeeks === null)}
                </div>
                {dose ? (
                  <div className="mt-1.5">
                    <div className="readout text-[34px] font-semibold leading-none">
                      {dose.units ?? dose.mass}
                    </div>
                    {dose.units && (
                      <div className="readout mt-1.5 text-[13px] text-muted">{dose.mass}</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5 font-display text-[20px] font-semibold leading-tight">
                    {text.phase(summary)}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <Ring
                  value={doseProgress(summary.info, now)}
                  size={72}
                  stroke={7}
                  color={primaryColor}
                  label={text.phase(summary)}
                >
                  {readout.kind === 'finished' ? (
                    <Check className="size-6 text-signal" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <div className="text-center leading-none">
                      <div className="readout text-[20px] font-semibold">{ring.main}</div>
                      {ring.sub && <div className="spec mt-0.5 text-[9.5px]">{ring.sub}</div>}
                    </div>
                  )}
                </Ring>
                {(readout.kind === 'dosing' || readout.kind === 'maintenance') && (
                  <span className="spec text-[9.5px]">{t('common.week')}</span>
                )}
              </div>
            </div>
            {summary.next && !deciding && (
              <p className="mt-3.5 text-[13.5px] leading-snug text-ink-2">
                <NextChange summary={summary} />
              </p>
            )}
          </>
        ) : (
          summary && (
            <p className="readout mt-3 text-[12.5px] text-muted">
              {fmtDate(summary.info.startsOn, locale, 'd MMM yyyy')}
              {summary.info.endsOn
                ? ` → ${fmtDate(addDays(summary.info.endsOn, -1), locale, 'd MMM yyyy')}`
                : ''}
            </p>
          )
        )}
      </button>

      {canEdit && <DecisionBand actions={actions} />}
      {canEdit && <CardActions actions={actions} />}
      {canEdit && <ProtocolSheets actions={actions} />}
    </Card>
  )
}
