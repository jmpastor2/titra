import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useCycleText } from './cycleText'
import type { CycleSummary } from './cycleView'
import { NextChange } from './NextChange'
import { ProtocolSheets } from './ProtocolSheets'
import { useProtocolActions, type ActionContext, type ProtocolActions } from './useProtocolActions'

/**
 * The moment to decide, short: the dose goes up soon, so go on or keep this one another
 * week. A band across the foot of the cycle's card, tinted amber. Nothing shows until the
 * change is close enough to decide on, or where the step cannot be held (an open-ended one).
 */
export function DecisionBand({ actions }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const text = useCycleText()
  const { summary } = actions
  if (!actions.hold || !summary?.info.decisionDue || !summary.next) return null
  const when = text.nextWhen(summary)

  return (
    <div className="border-t border-line bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] px-4 py-3.5">
      <div className="text-[12.5px] font-semibold text-warn">
        {t('protocols.decision.title')}
        {when && ` · ${when}`}
      </div>
      <p className="mt-1 text-[15px] font-semibold leading-snug">
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

/**
 * Where a decision is only flagged (the protocol's card and page): a small amber note,
 * "Toca decidir mañana", that leads to Ciclos, where it is taken.
 */
export function DecisionBadge({ summary }: { summary: CycleSummary }) {
  const { t } = useTranslation()
  const text = useCycleText()
  const when = text.nextWhen(summary)
  return (
    // The link answers a 44 px target; the badge inside it stays small.
    <Link to="/cycles" className="tap-link inline-flex rounded-full">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-warn-soft py-1 pl-2.5 pr-1.5 text-[12.5px] font-semibold leading-tight text-warn">
        {when ? t('protocols.decision.badge', { when }) : t('protocols.decision.title')}
        <ChevronRight aria-hidden className="size-3.5" />
      </span>
    </Link>
  )
}
