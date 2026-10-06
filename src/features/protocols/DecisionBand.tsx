import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useCycleText } from './cycleText'
import { NextChange } from './NextChange'
import { ProtocolSheets } from './ProtocolSheets'
import { useProtocolActions, type ActionContext, type ProtocolActions } from './useProtocolActions'

/**
 * The moment to decide, short: the dose goes up soon, so go on or keep this one another
 * week. Nothing shows until the change is close enough to decide on, or where the step
 * cannot be held (an open-ended one).
 */
export function DecisionBand({
  actions,
  inset = false,
}: {
  actions: ProtocolActions
  /** A box inside a card's padding, instead of a band across its full width. */
  inset?: boolean
}) {
  const { t } = useTranslation()
  const text = useCycleText()
  const { summary } = actions
  if (!actions.hold || !summary?.info.decisionDue || !summary.next) return null
  const when = text.nextWhen(summary)

  return (
    <div
      className={
        inset
          ? 'mt-3 rounded-control border border-warn/30 bg-warn-soft px-3.5 py-3'
          : 'border-t border-warn/30 bg-warn-soft px-4 py-3.5'
      }
    >
      <div className="spec flex flex-wrap gap-x-2 text-warn">
        <span>{t('protocols.decision.title')}</span>
        {when && <span>· {when}</span>}
      </div>
      <p className="mt-1 text-[14.5px] font-semibold leading-snug">
        <NextChange summary={summary} withWhen={false} />
      </p>
      <p className="mt-0.5 text-[12.5px] text-ink-2">{t('protocols.decision.hint')}</p>
      <Button size="md" variant="secondary" className="mt-3" onClick={() => actions.open('hold')}>
        {t('protocolMenu.hold')}
      </Button>
    </div>
  )
}

/**
 * The decision of a protocol on a screen that is not its card (Ciclos): its own actions and
 * the sheet behind "keep one more week". Renders nothing when there is nothing to decide.
 */
export function ProtocolDecision(context: ActionContext) {
  const actions = useProtocolActions(context)
  return (
    <>
      <DecisionBand actions={actions} />
      {actions.summary?.info.decisionDue && <ProtocolSheets actions={actions} />}
    </>
  )
}
