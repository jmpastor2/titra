/**
 * What one administration of the dose timeline says in words: when, how much (everything that
 * went in the syringe) and how it sat against the plan. Pure; see timelineText.test.ts.
 */
import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import type { TFunction } from 'i18next'
import { compoundById } from '@/content/compounds'
import type { DoseUnit } from '@/domain/types'
import { fmtDeltaMin } from '@/features/doses/delta'
import { fmtDoseList, type Locale } from '@/lib/format'
import type { TimelineItem } from './doseTimeline'

/** What an administration was, in words: when, how much, and how it sat against the plan. */
export function describeTimelineItem(
  item: TimelineItem,
  unit: DoseUnit,
  locale: Locale,
  t: TFunction,
) {
  const dfl = locale === 'es' ? es : enUS
  const parts = [
    { valueMg: item.doseMg, unit },
    ...item.partners.map((p) => ({
      valueMg: p.mg,
      unit: compoundById(p.compoundId)?.defaultUnit ?? unit,
    })),
  ]
  const when = format(item.at, 'EEE d MMM, HH:mm', { locale: dfl })
  const status =
    item.state === 'late' || item.state === 'early'
      ? `${t(`charts.timeline.state.${item.state}`)} · ${fmtDeltaMin(item.deltaMin ?? 0)}`
      : t(`charts.timeline.state.${item.state}`)
  const differs = item.plannedMg !== null && Math.abs(item.doseMg - item.plannedMg) > 1e-9
  const plan = differs
    ? t('charts.timeline.planDose', {
        dose: fmtDoseList([{ valueMg: item.plannedMg ?? 0, unit }], locale),
      })
    : null
  return { when, dose: fmtDoseList(parts, locale), status, plan }
}
