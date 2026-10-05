import { ArrowUp, CalendarClock, ChevronDown, CircleHelp } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { compoundById } from '@/content/compounds'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { useLocale } from '@/lib/useLocale'
import type { CycleDecision } from './decision'
import type { RuleHit } from './rule'
import { SubstanceDots } from './SubstanceDots'
import { decisionDoses, decisionSentence, protocolTitle, whenText } from './text'

/** Buttons that may carry a longer label than a pill is tall for: two lines are fine. */
const WRAP = 'h-auto! min-h-11 whitespace-normal px-3! py-1.5 text-[13.5px]! leading-tight'

/**
 * The decision about a change of dose: what changes and when, the person's own rule as a
 * reminder, and the answers. `collapsed` folds it into one line (decided to decide later).
 */
export function DecisionCard({
  protocol,
  decision,
  vials,
  logged,
  collapsed,
  busy,
  onExpand,
  onAcknowledge,
  onHold,
  onLater,
  onNewCycle,
}: {
  protocol: ProtocolRow
  decision: CycleDecision
  vials: readonly InventoryRow[]
  /** The symptoms of the person's own rule that were logged this week. */
  logged: readonly RuleHit[]
  collapsed: boolean
  busy: boolean
  onExpand: () => void
  /** Go ahead as planned (or "understood"): the decision is dealt with. */
  onAcknowledge: () => void
  /** One more week on the step: the change moves back a week. */
  onHold: () => void
  onLater: () => void
  onNewCycle: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const titleId = useId()
  const pl = useMemo(() => toProtocolLike(protocol), [protocol])
  const unit = compoundById(protocol.compound_id)?.defaultUnit ?? 'mg'
  const sentence = decisionSentence(decision, decisionDoses(decision, pl, vials), unit, t, locale)
  const name = protocolTitle(protocol)
  const { kind } = decision
  const asks = kind === 'increase' || kind === 'rest'
  const ends = kind === 'end' || kind === 'finished'

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="card fade-up flex w-full items-center gap-3 border-warn/30 px-4 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60 active:scale-[0.99]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-warn/40 bg-warn-soft text-warn">
          <CalendarClock aria-hidden className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13.5px] font-semibold">
            <SubstanceDots protocol={protocol} />
            <span className="truncate">{name}</span>
          </span>
          <span className="spec mt-0.5 block text-warn">{t('cycle.decision.pending')}</span>
        </span>
        {kind !== 'finished' && (
          <span className="readout shrink-0 text-[11.5px] font-semibold text-warn">
            {whenText(decision.daysAway, t)}
          </span>
        )}
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted" />
      </button>
    )
  }

  return (
    <Card instrument tone={asks ? 'signal' : 'default'} aria-labelledby={titleId}>
      <div className="flex items-center justify-between gap-3">
        <div className="spec text-signal">
          {t(asks ? 'cycle.decision.eyebrow' : 'cycle.decision.eyebrowInfo')}
        </div>
        {kind !== 'finished' && (
          <span className="readout shrink-0 rounded-full border border-warn/40 bg-warn-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-warn">
            {whenText(decision.daysAway, t)}
          </span>
        )}
      </div>
      <h2
        id={titleId}
        className="mt-1.5 flex items-center gap-1.5 font-display text-[19px] font-bold leading-tight"
      >
        <SubstanceDots protocol={protocol} />
        <span className="min-w-0">{name}</span>
      </h2>

      <p className="mt-3 text-[15px] leading-snug">{sentence}</p>

      {kind === 'increase' && (
        <div className="mt-3 flex items-start gap-2.5 rounded-control border border-line bg-panel-2 px-3 py-2.5">
          <CircleHelp aria-hidden className="mt-0.5 size-4 shrink-0 text-signal" />
          <div>
            <div className="text-[13.5px] font-semibold">{t('cycle.decision.rule')}</div>
            <div className="mt-0.5 text-[12px] leading-snug text-muted">
              {t('cycle.decision.ruleHint')}
            </div>
            {logged.length > 0 && (
              <div className="mt-1.5 text-[12.5px] font-semibold leading-snug text-warn">
                {t('cycle.decision.logged', {
                  list: logged
                    .map(
                      (h) =>
                        `${t(`symptoms.kinds.${h.kind}`).toLocaleLowerCase(locale)} (${h.count})`,
                    )
                    .join(', '),
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {kind === 'increase' && (
          <>
            <Button
              block
              disabled={busy}
              leading={<ArrowUp aria-hidden className="size-4" />}
              onClick={onAcknowledge}
            >
              {t('cycle.action.up')}
            </Button>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Button variant="secondary" className={WRAP} disabled={busy} onClick={onHold}>
                {t('cycle.action.hold')}
              </Button>
              <Button variant="ghost" className={WRAP} onClick={onLater}>
                {t('cycle.action.later')}
              </Button>
            </div>
          </>
        )}
        {kind === 'rest' && (
          <div className="grid grid-cols-2 gap-2">
            <Button className={WRAP} disabled={busy} onClick={onAcknowledge}>
              {t('cycle.action.understood')}
            </Button>
            {decision.holdIndex !== null && (
              <Button variant="secondary" className={WRAP} disabled={busy} onClick={onHold}>
                {t('cycle.action.extend')}
              </Button>
            )}
          </div>
        )}
        {kind === 'resume' && (
          <Button block disabled={busy} onClick={onAcknowledge}>
            {t('cycle.action.understood')}
          </Button>
        )}
        {ends && (
          <>
            <Button block onClick={onNewCycle}>
              {t('cycle.action.newCycle')}
            </Button>
            <Button variant="ghost" block className={WRAP} disabled={busy} onClick={onAcknowledge}>
              {t('cycle.action.notNow')}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
