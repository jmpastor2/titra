import { clsx } from 'clsx'
import { CycleDecisions } from './CycleDecisions'
import { CycleOverview } from './CycleOverview'

/**
 * The cycle of every active protocol: what it asks (a decision about the dose, doses that do
 * not match the plan) and where each one stands. The home screen places the two parts apart
 * (`CycleDecisions` under the next dose, `CycleOverview` further down); this puts them together.
 *
 * `focusProtocolId` (the notification link `#/?cycle=<id>`) opens that protocol's decision
 * even if it was put off, and its steps.
 */
export function CycleCard({
  focusProtocolId = null,
  className,
}: {
  focusProtocolId?: string | null
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <CycleDecisions focusProtocolId={focusProtocolId} />
      <CycleOverview focusProtocolId={focusProtocolId} />
    </div>
  )
}
