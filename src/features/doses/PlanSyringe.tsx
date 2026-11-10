import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Syringe } from '@/components/dosing/Syringe'
import { compoundColor } from '@/content/substanceColor'
import { syringeFor, type DrawPlan, type SyringeCapacity } from '@/domain/dosing/draw'
import { fmtNumber } from '@/lib/format'
import { barrelFor, useSyringePref } from '@/lib/syringePref'
import { useLocale } from '@/lib/useLocale'

/** The barrel a plan is drawn on: the person's own syringe when the dose fits in it. */
export function useBarrel(plan: DrawPlan | null): {
  capacity: SyringeCapacity
  /** The dose does not fit the syringe the person uses. */
  overflows: boolean
} {
  const pref = useSyringePref()
  if (plan) return barrelFor(pref, plan.totalUnits, plan.capacity)
  return { capacity: pref === 'auto' ? syringeFor(0) : pref, overflows: false }
}

/**
 * A draw plan on the syringe: each load in its substance's colour, drawn up in turn. Empty
 * without a plan. A tap draws it up again.
 */
export function PlanSyringe({
  plan,
  className,
  animate,
  pushed,
}: {
  plan: DrawPlan | null
  className?: string
  /** See `Syringe`. */
  animate?: boolean
  pushed?: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { capacity } = useBarrel(plan)
  const [replay, setReplay] = useState(0)
  const loads = (plan?.loads ?? []).map((l) => ({
    from: l.from,
    to: l.to,
    color: compoundColor(l.compoundId),
  }))

  return (
    // The tap is a flourish, not a control: nothing for assistive tech to operate.
    <div className={className} onClick={() => setReplay((n) => n + 1)}>
      <Syringe
        key={replay}
        capacity={capacity}
        loads={loads}
        animate={animate}
        pushed={pushed}
        label={t('draw.aria', { capacity, units: fmtNumber(plan?.totalUnits ?? 0, locale, 1) })}
        className="block w-full"
      />
    </div>
  )
}
