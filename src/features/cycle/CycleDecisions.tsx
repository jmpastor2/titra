import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DecisionCard } from './DecisionCard'
import { DriftNotice } from './DriftNotice'
import { openDecision, pendingDecisions } from './queue'
import { ruleHits } from './rule'
import { useCycleActions, useDecideLater } from './useCycleActions'
import { useCycleBoard } from './useCycleBoard'

/**
 * What the cycles ask of the person: where the doses taken do not match the plan (that comes
 * first) and, when the dose is about to change, the decision to go up or hold one more week.
 * With several decisions due only one is open at a time, so they do not fill the screen.
 * Nothing at all when there is nothing to ask. `focusProtocolId` is the notification link
 * `#/?cycle=<id>`: that protocol's decision opens even if it was put off.
 */
export function CycleDecisions({
  focusProtocolId = null,
  className,
}: {
  focusProtocolId?: string | null
  className?: string
}) {
  const nav = useNavigate()
  // Read here, not handed down: the answer and the data it answers from render together.
  const board = useCycleBoard(focusProtocolId)
  const { patientId, uid, now, items, vials, symptoms } = board
  const actions = useCycleActions(patientId, uid, vials)
  const later = useDecideLater(uid, now)
  const [chosenKey, setChosenKey] = useState<string | null>(null)
  const logged = useMemo(() => ruleHits(symptoms, now), [symptoms, now])

  const pending = pendingDecisions(items, focusProtocolId)
  const drifting = items.flatMap((item) => (item.drift ? [{ item, drift: item.drift }] : []))
  if (board.loading || (drifting.length === 0 && pending.length === 0)) return null

  const openKey = openDecision(pending, {
    focusId: focusProtocolId,
    chosenKey,
    isLater: later.isLater,
  })

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {drifting.map(({ item, drift }) => (
        <DriftNotice
          key={`drift-${item.protocol.id}`}
          protocol={item.protocol}
          info={item.info}
          drift={drift}
          vials={vials}
          busy={actions.busy}
          onUpdate={() => actions.updatePlan(item, drift)}
          onOnce={() => actions.once(item, drift)}
        />
      ))}

      {pending.map(({ item, decision, key }) => (
        <DecisionCard
          key={`decision-${item.protocol.id}`}
          protocol={item.protocol}
          decision={decision}
          vials={vials}
          logged={logged}
          collapsed={key !== openKey}
          busy={actions.busy}
          onExpand={() => {
            later.reopen(key)
            setChosenKey(key)
          }}
          onAcknowledge={() => actions.acknowledge(item, decision)}
          onHold={() => actions.hold(item, decision)}
          onLater={() => {
            later.postpone(key)
            setChosenKey(null)
          }}
          onNewCycle={() => nav('/cycles')}
        />
      ))}
    </div>
  )
}
