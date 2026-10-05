import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { SectionTitle, Skeleton } from '@/components/ui/primitives'
import { CycleRow } from './CycleRow'
import { useCycleBoard } from './useCycleBoard'

/**
 * The cycle of every active protocol on one card, a compact row each: which week of how many,
 * the week track, the dose now and the next change; a tap opens the plan's steps. A row whose
 * dose is about to change lights its next change. `index` numbers the section like the others
 * of the screen.
 */
export function CycleOverview({
  focusProtocolId = null,
  index,
  className,
}: {
  /** The notification link `#/?cycle=<id>`: that protocol's steps open. */
  focusProtocolId?: string | null
  index?: string
  className?: string
}) {
  const { t } = useTranslation()
  const board = useCycleBoard(focusProtocolId)
  const { readOnly, now, items, vials, doses } = board

  // Which row is open: what the person chose, else the one a notification pointed at.
  const [chosen, setChosen] = useState<{ id: string | null } | null>(null)
  const [seenFocus, setSeenFocus] = useState(focusProtocolId)
  if (seenFocus !== focusProtocolId) {
    setSeenFocus(focusProtocolId)
    setChosen(null)
  }
  const openId = chosen ? chosen.id : focusProtocolId

  if (board.loading) {
    return (
      <Card className={className}>
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }
  if (items.length === 0) return null

  return (
    <section className={className}>
      <SectionTitle
        {...(index ? { index } : {})}
        action={
          !readOnly && (
            <Link to="/cycles" className="spec text-signal">
              {t('common.seeAll')}
            </Link>
          )
        }
      >
        {t('cycle.eyebrow')}
      </SectionTitle>
      <Card>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <CycleRow
              key={item.protocol.id}
              cycle={item}
              vials={vials}
              doses={doses}
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
    </section>
  )
}
