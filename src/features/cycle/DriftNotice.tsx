import { TriangleAlert } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { compoundById } from '@/content/compounds'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import type { CycleInfo } from '@/domain/dosing/cycle'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { doseInline, stepDose } from './dose'
import type { DoseDrift } from './drift'
import { SubstanceDots } from './SubstanceDots'
import { protocolTitle } from './text'

/**
 * The doses taken do not match the plan: say so, with what each says, and let the person
 * either bring the plan up to what they take or say it was a one-off.
 */
export function DriftNotice({
  protocol,
  info,
  drift,
  vials,
  busy,
  onUpdate,
  onOnce,
}: {
  protocol: ProtocolRow
  info: CycleInfo
  drift: DoseDrift
  vials: readonly InventoryRow[]
  busy: boolean
  /** Bring the step in force up to the dose actually taken. */
  onUpdate: () => void
  /** It was a one-off: leave the plan as it is and do not ask again about these doses. */
  onOnce: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const titleId = useId()
  const pl = useMemo(() => toProtocolLike(protocol), [protocol])
  const unit = compoundById(protocol.compound_id)?.defaultUnit ?? 'mg'
  const text = (mg: number) => doseInline(stepDose(pl, vials, mg), unit, locale)
  // The dose taken is what the plan sets from the next step: say when, so "it goes up" is not a surprise.
  const nextOn = drift.matchesNextStep ? info.next?.on : undefined

  return (
    <Card tone="warn" aria-labelledby={titleId}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-warn/40 bg-warn-soft text-warn">
          <TriangleAlert aria-hidden className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="spec text-warn">{t('cycle.drift.eyebrow')}</div>
          <h2
            id={titleId}
            className="mt-1 flex items-start gap-1.5 text-[14px] font-semibold leading-snug"
          >
            <span className="mt-[3px]">
              <SubstanceDots protocol={protocol} />
            </span>
            <span className="min-w-0 break-words">{protocolTitle(protocol)}</span>
          </h2>
        </div>
      </div>
      <p className="mt-3 text-[14.5px] leading-snug">
        {t('cycle.drift.body', {
          planned: text(drift.plannedMg),
          n: drift.doses,
          actual: text(drift.actualMg),
        })}
      </p>
      <p className="mt-1 text-[12.5px] leading-snug text-muted">
        {t('cycle.drift.since', { date: fmtDate(drift.sinceDay, locale, 'EEEE d') })}
        {nextOn && ` ${t('cycle.drift.nextStep', { date: fmtDate(nextOn, locale, 'EEEE d') })}`}
      </p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <Button disabled={busy} onClick={onUpdate}>
          {t('cycle.drift.update')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onOnce}>
          {t('cycle.drift.once')}
        </Button>
      </div>
    </Card>
  )
}
