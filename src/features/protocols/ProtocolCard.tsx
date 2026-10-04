import { addDays } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, InventoryRow, ProtocolRow, ProtocolStatus } from '@/data/database.types'
import { protocolCompoundIds, toDoseEvent } from '@/data/mappers'
import { adherence } from '@/domain/dosing/schedule'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useCycleText } from './cycleText'
import { doseView, fmtDoseView } from './cycleView'
import { NextChange } from './NextChange'
import { CardActions } from './ProtocolButtons'
import { ProtocolSheets } from './ProtocolSheets'
import { useScheduleLabel } from './scheduleLabel'
import { TitrationLadder, type LadderDisplay } from './TitrationLadder'
import { useProtocolActions } from './useProtocolActions'
import type { UndoOffer } from './useUndoOffer'

const STATUS_TONE: Record<ProtocolStatus, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  paused: 'warn',
  completed: 'neutral',
  archived: 'neutral',
}

/**
 * One protocol on the list: where the cycle stands (week, dose in syringe units and mass,
 * what changes next), its ladder and adherence, with Edit and "⋯" always in reach.
 */
export function ProtocolCard({
  p,
  doses,
  vials,
  now,
  canEdit,
  offerUndo,
}: {
  p: ProtocolRow
  /** Recent doses, for adherence; omitted for past protocols. */
  doses?: readonly DoseRow[]
  vials: readonly InventoryRow[]
  now: Date
  canEdit: boolean
  offerUndo: (offer: UndoOffer) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  const text = useCycleText()
  const scheduleLabel = useScheduleLabel()
  const actions = useProtocolActions({ protocol: p, vials, now, offerUndo })
  const { pl, summary } = actions
  const ids = protocolCompoundIds(p)
  const primaryColor = compoundColor(p.compound_id)
  const unit = compoundById(p.compound_id)?.defaultUnit ?? 'mg'
  const current = p.status === 'active' || p.status === 'paused'

  const adh = useMemo(
    () =>
      doses && p.status === 'active'
        ? adherence(
            pl,
            doses
              .filter(
                (d) =>
                  d.compound_id === p.compound_id && (!d.protocol_id || d.protocol_id === p.id),
              )
              .map(toDoseEvent),
            now,
          )
        : null,
    [doses, p, pl, now],
  )

  // The ladder reads in syringe units when the vial is known: it is what he draws.
  const probe = pl.steps.find((s) => !s.pause)?.doseMg
  const display: LadderDisplay | undefined =
    probe && doseView(pl, probe, vials).units !== null
      ? { value: (mg) => doseView(pl, mg, vials).units ?? 0, unit: t('units.units') }
      : undefined
  const dose = summary?.dose ? fmtDoseView(summary.dose, locale) : null
  const decision = actions.hold && summary?.info.decisionDue ? summary.next : null

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
            <div className="flex items-center gap-1.5">
              {ids.map((id) => (
                <SubstanceDot key={id} color={compoundColor(id)} />
              ))}
              <span className="truncate font-display text-[17px] font-semibold">{p.name}</span>
            </div>
            <div className="readout mt-1 text-[12.5px] text-muted">
              {scheduleLabel(pl.steps, pl.times)}
            </div>
          </div>
          <Badge tone={STATUS_TONE[p.status]}>{t(`protocols.statuses.${p.status}`)}</Badge>
        </div>

        {current && summary ? (
          <div className="mt-3.5">
            <div className="spec">{text.phase(summary)}</div>
            {dose && (
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="readout text-[26px] font-semibold leading-none">
                  {dose.units ?? dose.mass}
                </span>
                {dose.units && (
                  <span className="readout text-[13px] text-muted">({dose.mass})</span>
                )}
              </div>
            )}
            {summary.next && (
              <p className="mt-2 text-[13px] leading-snug text-ink-2">
                <NextChange summary={summary} />
              </p>
            )}
          </div>
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

        {adh && adh.expected > 0 && (
          <div className="mt-3">
            <span className="spec">
              {t('protocols.adherence')}{' '}
              <span className={adh.ratio >= 0.9 ? 'readout text-signal' : 'readout text-warn'}>
                {t('protocols.adherenceValue', {
                  taken: adh.taken,
                  expected: adh.expected,
                  pct: Math.round(adh.ratio * 100),
                })}
              </span>
            </span>
          </div>
        )}

        {pl.steps.length > 1 && (
          <div className="mt-3.5">
            <TitrationLadder
              protocol={pl}
              unit={unit}
              color={primaryColor}
              now={now}
              display={display}
              summary={false}
            />
          </div>
        )}
      </button>

      {canEdit && decision && summary && (
        <div className="border-t border-warn/30 bg-warn-soft px-4 py-3">
          <p className="text-[13px] font-medium leading-snug text-ink">
            {t('protocols.cycle.decision', {
              date: text.day(decision.change.on),
              dose: decision.dose ? text.doseShort(decision.dose) : '',
            })}
          </p>
          <Button
            size="md"
            variant="secondary"
            className="mt-2.5"
            onClick={() => actions.open('hold')}
          >
            {t('protocolMenu.hold')}
          </Button>
        </div>
      )}

      {canEdit && <CardActions actions={actions} />}
      {canEdit && <ProtocolSheets actions={actions} />}
    </Card>
  )
}
