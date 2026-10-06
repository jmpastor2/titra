import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Syringe, type SyringeLoad } from '@/components/dosing/Syringe'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { syringeFor, type DrawPlan } from '@/domain/dosing/draw'
import { fmtDose, fmtNumber } from '@/lib/format'
import { barrelFor, useSyringePref } from '@/lib/syringePref'
import { useLocale } from '@/lib/useLocale'

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id

const NO_LOADS: readonly SyringeLoad[] = []

/**
 * What to draw, drawn: total units, the syringe at that mark and the order of the loads. The
 * result of the dose form, so it is the one soft panel of the sheet. Without a valid dose yet
 * (`plan` null while the amount is being retyped) it keeps its place with an empty syringe,
 * so nothing under it jumps while typing.
 */
export function DrawGuide({ plan }: { plan: DrawPlan | null }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const u = (n: number) => fmtNumber(n, locale, 1)
  const stacked = plan !== null && plan.loads.length > 1
  const pref = useSyringePref()
  const { capacity, overflows } = plan
    ? barrelFor(pref, plan.totalUnits, plan.capacity)
    : { capacity: pref === 'auto' ? syringeFor(0) : pref, overflows: false }
  const blend = plan?.loads.find((l) => l.compoundIds.length > 1)

  return (
    <div className="rounded-control bg-panel-2 px-4 pb-3 pt-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="spec">{t('draw.title')}</span>
        <span className="spec readout">U-100 · {fmtNumber(capacity / 100, locale, 1)} mL</span>
      </div>
      <div className="mt-1 flex min-h-[34px] items-baseline gap-1.5">
        {plan ? (
          <>
            <span className="readout text-[34px] font-semibold leading-none text-signal">
              {u(plan.totalUnits)}
            </span>
            <span className="readout text-[15px] font-semibold text-signal">U</span>
            <span className="readout ml-1 text-[12.5px] text-muted">
              = {fmtNumber(plan.totalMl, locale, 2)} mL
            </span>
          </>
        ) : (
          <span className="self-center text-[13px] text-muted">{t('doses.drawWaiting')}</span>
        )}
      </div>

      <Syringe
        capacity={capacity}
        loads={
          plan
            ? plan.loads.map((l) => ({
                from: l.from,
                to: l.to,
                color: compoundColor(l.compoundId),
              }))
            : NO_LOADS
        }
        label={t('draw.aria', { capacity, units: u(plan?.totalUnits ?? 0) })}
        className="mt-1 w-full"
      />

      {plan && stacked && (
        <ol className="mt-1 flex flex-col gap-1.5">
          {plan.loads.map((l, i) => {
            const unit = compoundById(l.compoundId)?.defaultUnit ?? 'mg'
            return (
              <li key={l.compoundId} className="flex items-center gap-2 text-[13px]">
                <span className="readout grid size-5 shrink-0 place-items-center rounded-full bg-panel-3 text-[10.5px] font-bold">
                  {i + 1}
                </span>
                <SubstanceDot color={compoundColor(l.compoundId)} />
                <span className="min-w-0 flex-1 break-words font-semibold">
                  {l.compoundIds.map(nameOf).join(' + ')}
                </span>
                <span className="readout shrink-0 text-[12px] text-muted">
                  {fmtDose(l.doseMg, unit, locale)}
                </span>
                <span className="readout shrink-0 font-semibold text-ink">
                  {i === 0
                    ? t('draw.firstLoad', { units: u(l.units) })
                    : t('draw.nextLoad', { units: u(l.units), to: u(l.to) })}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      {stacked && <p className="mt-2 text-[12px] leading-snug text-muted">{t('draw.mixHint')}</p>}
      {blend && (
        <p className="mt-1.5 text-[12px] leading-snug text-muted">
          {t('draw.blendHint', { names: blend.compoundIds.map(nameOf).join(' + ') })}
        </p>
      )}
      {plan && plan.offRatio.length > 0 && (
        <Warning>{t('draw.offRatio', { names: plan.offRatio.map(nameOf).join(', ') })}</Warning>
      )}

      {plan && !plan.fits && <Warning>{t('draw.notFits')}</Warning>}
      {plan?.fits && overflows && (
        <Warning>{t('draw.overflowsYours', { units: pref === 'auto' ? '' : pref })}</Warning>
      )}
      {plan && plan.imprecise.length > 0 && (
        <Warning>{t('draw.imprecise', { names: plan.imprecise.map(nameOf).join(', ') })}</Warning>
      )}
      {plan && plan.unknown.length > 0 && (
        <Warning>{t('draw.unknown', { names: plan.unknown.map(nameOf).join(', ') })}</Warning>
      )}
    </div>
  )
}

function Warning({ children }: { children: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-warn">
      <AlertTriangle className="mt-px size-3.5 shrink-0" />
      {children}
    </p>
  )
}
