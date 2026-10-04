import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/primitives'
import { useAlertDismissals, useDoses, useInventory, useProtocols, useSymptoms } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { useNow } from '@/lib/useNow'
import { CycleRow } from './CycleRow'
import { DecisionCard } from './DecisionCard'
import { DriftNotice } from './DriftNotice'
import { attention, type CycleAttention } from './items'
import { openDecision, pendingDecisions, type Item } from './queue'
import { ruleHits } from './rule'
import { useCycleActions, useDecideLater } from './useCycleActions'
import { useCycleInfos } from './useCycleInfos'

/** Nothing to ask: what a read-only view, or one still loading, shows. */
const NONE: CycleAttention = { drift: null, decision: null }

/**
 * The cycle of every active protocol on the home screen: which week of how many, the dose
 * now and the next change; and, when the dose is about to change, the decision to go up or
 * hold one more week. Where the doses taken do not match the plan, that comes first.
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
  const { t } = useTranslation()
  const nav = useNavigate()
  const { patientId, readOnly } = usePatientScope()
  const { user } = useSession()
  const uid = user?.id ?? ''
  const now = useNow()

  const protocols = useProtocols(patientId)
  const inventory = useInventory(patientId)
  const doses = useDoses(patientId, 120)
  const dismissals = useAlertDismissals(readOnly ? undefined : uid)
  const symptoms = useSymptoms(readOnly ? undefined : patientId, 90)
  const cycles = useCycleInfos(now)
  const vials = inventory.data ?? []
  const actions = useCycleActions(patientId, uid, vials)
  const later = useDecideLater(uid, now)

  // Which row is open: what the person chose, else the one a notification pointed at.
  const [chosen, setChosen] = useState<{ id: string | null } | null>(null)
  const [seenFocus, setSeenFocus] = useState(focusProtocolId)
  if (seenFocus !== focusProtocolId) {
    setSeenFocus(focusProtocolId)
    setChosen(null)
  }
  const openId = chosen ? chosen.id : focusProtocolId
  // With several decisions due only one is open at a time, so they do not fill the screen.
  const [chosenKey, setChosenKey] = useState<string | null>(null)

  // Until the read marks and the doses are known nothing is asked: an answered decision must
  // not flash up, nor a plan announce a step the doses already took.
  const waiting = dismissals.isLoading || doses.isLoading
  const dismissed = useMemo(
    () => new Set((dismissals.data ?? []).map((d) => d.alert_key)),
    [dismissals.data],
  )
  const logged = useMemo(() => ruleHits(symptoms.data ?? [], now), [symptoms.data, now])
  const items: Item[] = useMemo(
    () =>
      cycles.map((c) => ({
        ...c,
        ...(readOnly || waiting
          ? NONE
          : attention(c, doses.data ?? [], dismissed, now, c.protocol.id === focusProtocolId)),
      })),
    [cycles, readOnly, waiting, doses.data, dismissed, now, focusProtocolId],
  )

  if (protocols.isPending || inventory.isPending) {
    return (
      <Card className={className}>
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }
  if (items.length === 0) return null

  const pending = pendingDecisions(items, focusProtocolId)
  const openKey = openDecision(pending, {
    focusId: focusProtocolId,
    chosenKey,
    isLater: later.isLater,
  })

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {items.map((item) => {
        const drift = item.drift
        if (!drift) return null
        return (
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
        )
      })}

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

      <Card
        eyebrow={t('cycle.eyebrow')}
        action={
          !readOnly && (
            <Link to="/cycles" className="spec text-signal">
              {t('common.seeAll')}
            </Link>
          )
        }
      >
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <CycleRow
              key={item.protocol.id}
              cycle={item}
              vials={vials}
              doses={doses.data ?? []}
              now={now}
              expanded={openId === item.protocol.id}
              onToggle={() =>
                setChosen({ id: openId === item.protocol.id ? null : item.protocol.id })
              }
              urgent={Boolean(item.decision)}
              canEdit={!readOnly}
            />
          ))}
        </ul>
      </Card>
    </div>
  )
}
