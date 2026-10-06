import { addDays } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Kpi } from '@/components/kpi/Kpi'
import { Steps } from '@/components/kpi/Steps'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow, ProtocolRow, ProtocolStatus } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import { ladderSteps } from '@/features/cycles/ladder'
import { phaseWeeks } from '@/features/cycles/phase'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useCycleText } from './cycleText'
import { doseFigure } from './cycleView'
import { DecisionBadge } from './DecisionBand'
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
 * One protocol on the list: its name and rhythm, the dose now as the one big figure (in
 * syringe units when the vial is known, the mass under it), the plan as a staircase of
 * weeks and one line with the week and what changes next. A decision due is only flagged
 * here: it is taken on Hoy or Ciclos. Edit and "⋯" stay in reach.
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
  const scheduleLabel = useScheduleLabel()
  const actions = useProtocolActions({ protocol: p, vials, now, offerUndo })
  const { pl, summary } = actions
  const ids = protocolCompoundIds(p)
  const color = compoundColor(p.compound_id)
  const current = p.status === 'active' || p.status === 'paused'

  const figure = summary?.dose ? doseFigure(summary.dose, locale) : null
  // A plan with a single step has no staircase to draw.
  const ladder = useMemo(
    () =>
      summary && summary.info.steps.length > 1 ? ladderSteps(phaseWeeks(summary.info, now)) : null,
    [summary, now],
  )
  const line = summary ? text.line(summary, now) : null
  const deciding = Boolean(canEdit && actions.hold && summary?.info.decisionDue && summary.next)

  return (
    <Card padded={false} className="overflow-hidden">
      <button
        type="button"
        onClick={() => nav(`/protocols/${p.id}`)}
        className="block w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-1.5">
              <span className="flex shrink-0 items-center gap-1 pt-[8px]">
                {ids.map((id) => (
                  <SubstanceDot key={id} color={compoundColor(id)} />
                ))}
              </span>
              <h3 className="break-words text-[17px] font-semibold leading-snug">{p.name}</h3>
            </div>
            <div className="readout mt-0.5 text-[12.5px] text-muted">
              {scheduleLabel(pl.steps, pl.times)}
            </div>
          </div>
          {p.status !== 'active' && (
            <Badge tone={STATUS_TONE[p.status]}>{t(`protocols.statuses.${p.status}`)}</Badge>
          )}
        </div>

        {current && summary ? (
          <>
            {figure ? (
              <Kpi
                className="mt-4"
                size="lg"
                label={t('protocolDetail.doseNow')}
                value={figure.value}
                unit={figure.unit}
                caption={figure.sub}
              />
            ) : (
              <p className="mt-4 text-[20px] font-semibold leading-tight">{text.phase(summary)}</p>
            )}
            {ladder && (
              <Steps
                className="mt-4"
                steps={ladder}
                color={color}
                height={22}
                label={text.phase(summary)}
              />
            )}
            {line && <p className="mt-2.5 text-[13px] leading-snug text-ink-2">{line}</p>}
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

      {deciding && summary && (
        <div className="-mt-1 px-4 pb-3.5">
          <DecisionBadge summary={summary} />
        </div>
      )}
      {canEdit && <CardActions actions={actions} />}
      {canEdit && <ProtocolSheets actions={actions} />}
    </Card>
  )
}
