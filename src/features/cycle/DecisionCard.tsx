import { ArrowUp, ChevronDown, CircleHelp } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { compoundById } from '@/content/compounds'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { useLocale } from '@/lib/useLocale'
import type { CycleDecision } from './decision'
import type { RuleHit } from './rule'
import { SubstanceDots } from './SubstanceDots'
import { decisionDoses, decisionSentence, protocolTitle, whenText } from './text'

/** Buttons that may carry a longer label than a pill is tall for: two lines are fine. */
const WRAP = 'h-auto! min-h-11 whitespace-normal! px-3! py-1.5 text-[13.5px]! leading-tight'

/**
 * The decision about a change of dose, open: what changes and when, the person's own rule as a
 * reminder, and the answers (one ink button, the rest quiet). It sits inside the decisions card,
 * so it draws no panel of its own.
 */
export function DecisionBody({
  protocol,
  decision,
  vials,
  logged,
  busy,
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
  busy: boolean
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
  const { kind } = decision
  const asks = kind === 'increase' || kind === 'rest'
  const ends = kind === 'end' || kind === 'finished'

  return (
    <div role="group" aria-labelledby={titleId}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="spec">
          {t(asks ? 'cycle.decision.eyebrow' : 'cycle.decision.eyebrowInfo')}
        </div>
        {kind !== 'finished' && (
          <span className="readout shrink-0 text-[12.5px] font-semibold text-warn">
            {whenText(decision.daysAway, t)}
          </span>
        )}
      </div>
      <h2
        id={titleId}
        className="mt-1 flex items-start gap-2 text-[17px] font-semibold leading-snug"
      >
        <span className="mt-[8px]">
          <SubstanceDots protocol={protocol} />
        </span>
        <span className="min-w-0 break-words">{protocolTitle(protocol)}</span>
      </h2>

      <p className="mt-2 text-[15px] leading-snug">{sentence}</p>

      {kind === 'increase' && (
        <div className="mt-3 flex items-start gap-2.5">
          <CircleHelp aria-hidden className="mt-0.5 size-4 shrink-0 text-signal" />
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold leading-snug">
              {t('cycle.decision.rule')}
            </div>
            <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
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
    </div>
  )
}

/**
 * Something else the cycles ask, folded into one row of the decisions card: the substance, what
 * it is about in a few words and when. A tap opens it in place of the one that is open.
 */
export function EntryRow({
  protocol,
  text,
  when,
  onExpand,
}: {
  protocol: ProtocolRow
  text: string
  when: string | null
  onExpand: () => void
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex min-h-14 w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2 text-[14px] font-semibold leading-snug">
          <span className="mt-[6px]">
            <SubstanceDots protocol={protocol} />
          </span>
          <span className="min-w-0 break-words">{protocolTitle(protocol)}</span>
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{text}</span>
      </span>
      {when && (
        <span className="readout shrink-0 text-[12.5px] font-semibold text-warn">{when}</span>
      )}
      <ChevronDown aria-hidden className="size-4 shrink-0 text-muted" />
    </button>
  )
}
