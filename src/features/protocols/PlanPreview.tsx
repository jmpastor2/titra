import { addDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { InventoryRow } from '@/data/database.types'
import { useLocale } from '@/lib/useLocale'
import { Caution } from './Caution'
import { useCycleText } from './cycleText'
import { doseView, fmtDoseLine, fmtDoseView } from './cycleView'
import type { Origin, PlanModel } from './draft'
import { NextChange } from './NextChange'
import { PlanTimeline } from './PlanTimeline'

/**
 * The plan being typed, as dates: where you would be today, when the dose changes next,
 * when it ends, and every step on a timeline. Recalculated as the person edits.
 */
export function PlanPreview({
  model,
  origin,
  vials,
  now,
  color,
  split,
}: {
  model: PlanModel
  origin: Origin | null
  vials: readonly InventoryRow[]
  now: Date
  color: string
  /** The step in force is being saved as two (a dose change from this week). */
  split: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const { summary, plan } = model

  if (!summary || !plan) {
    return (
      <Card eyebrow={t('protocols.plan.eyebrow')} title={t('protocols.plan.title')}>
        <p className="text-[13px] text-muted">
          {model.openEndedInMiddle ? t('protocols.openEndedLastOnly') : t('protocols.plan.empty')}
        </p>
      </Card>
    )
  }

  const { info } = summary
  // Today's dose against what it was when the editor opened: editing the past can move it
  // without anyone touching today's dose, which is what is worth saying.
  const was = origin?.doseNowMg ?? null
  const before =
    was !== null &&
    !model.currentDoseEdited &&
    summary.dose &&
    Math.abs(was - summary.dose.doseMg) > 1e-9
      ? fmtDoseLine(doseView(plan, was, vials), locale)
      : null

  return (
    <Card tone="signal" eyebrow={t('protocols.plan.eyebrow')} title={t('protocols.plan.title')}>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-semibold">
          {text.phase(summary)}
          {summary.dose && <span className="readout"> · {fmtDoseLine(summary.dose, locale)}</span>}
        </p>
        {before && <Caution role="status">{t('protocols.plan.todayChanged', { before })}</Caution>}
        {summary.next && (
          <p className="text-[13.5px] text-ink-2">
            <NextChange summary={summary} />
          </p>
        )}
        <p className="readout text-[12px] text-muted">
          {info.endsOn
            ? t('protocols.plan.ends', {
                date: text.day(addDays(info.endsOn, -1)),
                count: info.totalWeeks ?? 0,
              })
            : t('protocols.plan.noEnd')}
        </p>
      </div>

      <div className="mt-3">
        <PlanTimeline
          info={info}
          now={now}
          color={color}
          doseOf={(step) => {
            const { units, mass } = fmtDoseView(doseView(plan, step.doseMg, vials), locale)
            return { main: units ?? mass, ...(units ? { sub: mass } : {}) }
          }}
        />
      </div>
      {split && (
        <p className="mt-2 text-[12px] leading-snug text-muted">{t('protocols.plan.split')}</p>
      )}
    </Card>
  )
}
