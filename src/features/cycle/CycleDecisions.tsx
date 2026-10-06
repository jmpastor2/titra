import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { compoundById } from '@/content/compounds'
import { toProtocolLike } from '@/data/mappers'
import { useLocale } from '@/lib/useLocale'
import { DecisionBody, EntryRow } from './DecisionCard'
import { DriftBody } from './DriftNotice'
import { boardEntries, openEntry, type Entry } from './queue'
import { ruleHits } from './rule'
import { decisionDoses, decisionShort, whenText } from './text'
import { useCycleActions, useDecideLater } from './useCycleActions'
import { useCycleBoard } from './useCycleBoard'

/**
 * What the cycles ask of the person, on one card: where the doses taken do not match the plan
 * and, when the dose is about to change, the decision to go up or hold one more week. One is
 * open at a time; the rest wait as rows underneath that open in its place. Nothing at all when
 * there is nothing to ask. `focusProtocolId` is the notification link `#/?cycle=<id>`: that
 * protocol's decision opens even if it was put off.
 */
export function CycleDecisions({
  focusProtocolId = null,
  className,
}: {
  focusProtocolId?: string | null
  className?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  // Read here, not handed down: the answer and the data it answers from render together.
  const board = useCycleBoard(focusProtocolId)
  const { patientId, uid, now, items, vials, symptoms } = board
  const actions = useCycleActions(patientId, uid, vials)
  const later = useDecideLater(uid, now)
  const [chosenKey, setChosenKey] = useState<string | null>(null)
  const logged = useMemo(() => ruleHits(symptoms, now), [symptoms, now])

  const entries = boardEntries(items, focusProtocolId)
  if (board.loading || entries.length === 0) return null

  const openKey = openEntry(entries, {
    focusId: focusProtocolId,
    chosenKey,
    isLater: later.isLater,
  })
  const open = entries.find((e) => e.key === openKey)
  const rest = entries.filter((e) => e !== open)

  const expand = (e: Entry) => {
    later.reopen(e.key)
    setChosenKey(e.key)
  }

  const rowText = (e: Entry) => {
    if (e.kind === 'drift') return t('cycle.short.drift')
    const pl = toProtocolLike(e.item.protocol)
    const unit = compoundById(e.item.protocol.compound_id)?.defaultUnit ?? 'mg'
    return decisionShort(e.decision, decisionDoses(e.decision, pl, vials), unit, t, locale)
  }

  return (
    <section
      aria-label={t('cycle.decision.cardAria')}
      className={clsx('card fade-up p-4', className)}
    >
      {open?.kind === 'drift' && (
        <DriftBody
          protocol={open.item.protocol}
          info={open.item.info}
          drift={open.drift}
          vials={vials}
          busy={actions.busy}
          onUpdate={() => actions.updatePlan(open.item, open.drift)}
          onOnce={() => actions.once(open.item, open.drift)}
        />
      )}
      {open?.kind === 'decision' && (
        <DecisionBody
          protocol={open.item.protocol}
          decision={open.decision}
          vials={vials}
          logged={logged}
          busy={actions.busy}
          onAcknowledge={() => actions.acknowledge(open.item, open.decision)}
          onHold={() => actions.hold(open.item, open.decision)}
          onLater={() => {
            later.postpone(open.key)
            setChosenKey(null)
          }}
          onNewCycle={() => nav('/cycles')}
        />
      )}
      {!open && <h2 className="spec">{t('cycle.decision.pendingTitle')}</h2>}

      {rest.length > 0 && (
        <ul className={clsx('divide-y divide-line', open && 'mt-4 border-t border-line')}>
          {rest.map((e) => (
            <li key={e.key}>
              <EntryRow
                protocol={e.item.protocol}
                text={rowText(e)}
                when={
                  e.kind === 'decision' && e.decision.kind !== 'finished'
                    ? whenText(e.decision.daysAway, t)
                    : null
                }
                onExpand={() => expand(e)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
