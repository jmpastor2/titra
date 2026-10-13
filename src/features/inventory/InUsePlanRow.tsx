import { startOfDay } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import type { InventoryRow } from '@/data/database.types'
import { useProtocols } from '@/data/hooks'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useSyringePref } from '@/lib/syringePref'
import { useLocale } from '@/lib/useLocale'
import { IN_USE_DAYS } from './alerts'
import { inUsePlan } from './inUsePlan'
import { parseAmount, plainAmount, waterToMl } from './reconstitute'
import type { WaterState } from './useWaterEntry'

/**
 * The proposal for the in-use period: the water that makes each dose a whole number of
 * units, and what the vial gives in its 28 days (doses, mg used, mg left when it must be
 * thrown away, or the day it runs out first). One tap puts the proposed water in the field.
 */
export function InUsePlanRow({
  vial,
  startedOn,
  water,
  onWater,
}: {
  vial: InventoryRow
  /** The day it is reconstituted ("yyyy-MM-dd"). */
  startedOn: string
  water: WaterState
  onWater: (next: WaterState) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const pref = useSyringePref()
  const plan = useMemo(
    () =>
      inUsePlan(
        vial,
        protocols.data ?? [],
        startOfDay(new Date(`${startedOn}T00:00`)),
        // No syringe chosen: propose for the smallest (0,3 mL, 30 U), the one most people use.
        pref === 'auto' ? 30 : pref,
      ),
    [vial, protocols.data, startedOn, pref],
  )
  if (!plan) return null

  const mg = (x: number) => fmtNumber(x, locale, 2)
  const date = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  const proposed = plan.waterMl
  const inField =
    proposed !== null && Math.abs(waterToMl(parseAmount(water.text), water.unit) - proposed) < 1e-6

  return (
    <section aria-label={t('reconstitute.plan.title', { days: IN_USE_DAYS })} className="pb-1">
      <div className="spec">{t('reconstitute.plan.title', { days: IN_USE_DAYS })}</div>
      {proposed !== null && plan.units !== null && (
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="min-w-0 text-[15px] font-semibold leading-snug">
            {t('reconstitute.plan.water', {
              ml: fmtNumber(proposed, locale, 1),
              units: fmtNumber(plan.units, locale, 1),
            })}
          </p>
          {!inField && (
            <button
              type="button"
              onClick={() => onWater({ text: plainAmount(proposed), unit: 'mL' })}
              className="min-h-11 shrink-0 rounded-full bg-signal-soft px-3.5 text-[13px] font-semibold text-signal"
            >
              {t('reconstitute.plan.use', { ml: fmtNumber(proposed, locale, 1) })}
            </button>
          )}
        </div>
      )}
      <p className="mt-1 text-[13px] leading-snug text-ink-2">
        {plan.runsOutAt
          ? t('reconstitute.plan.runsOut', { count: plan.doses, date: date(plan.runsOutAt) })
          : plan.leftMg > 0.05
            ? t('reconstitute.plan.left', {
                count: plan.doses,
                used: mg(plan.usedMg),
                left: mg(plan.leftMg),
                date: date(plan.until),
              })
            : t('reconstitute.plan.exact', { count: plan.doses, date: date(plan.until) })}
      </p>
    </section>
  )
}
