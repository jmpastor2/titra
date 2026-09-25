import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Syringe } from '@/components/dosing/Syringe'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { DrawPlan } from '@/domain/dosing/draw'
import { fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id

/** What to draw, drawn: total units, the syringe at that mark and the order of the loads. */
export function DrawGuide({ plan }: { plan: DrawPlan }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const u = (n: number) => fmtNumber(n, locale, 1)
  const stacked = plan.loads.length > 1

  return (
    <div className="rounded-control border border-line bg-panel-2 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="spec">{t('draw.title')}</span>
        <span className="spec">U-100 · {fmtNumber(plan.capacity / 100, locale, 1)} mL</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="readout text-glow text-[34px] font-semibold leading-none text-signal">
          {u(plan.totalUnits)}
        </span>
        <span className="readout text-[15px] font-semibold text-signal">U</span>
        <span className="readout ml-1 text-[12.5px] text-muted">
          = {fmtNumber(plan.totalMl, locale, 2)} mL
        </span>
      </div>

      <Syringe
        capacity={plan.capacity}
        loads={plan.loads.map((l) => ({
          from: l.from,
          to: l.to,
          color: compoundColor(l.compoundId),
        }))}
        label={t('draw.aria', { capacity: plan.capacity, units: u(plan.totalUnits) })}
        className="mt-1 w-full"
      />

      {stacked && (
        <ol className="mt-1 flex flex-col gap-1.5">
          {plan.loads.map((l, i) => {
            const unit = compoundById(l.compoundId)?.defaultUnit ?? 'mg'
            return (
              <li key={l.compoundId} className="flex items-center gap-2 text-[13px]">
                <span className="readout grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-[10.5px] font-bold">
                  {i + 1}
                </span>
                <SubstanceDot color={compoundColor(l.compoundId)} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {nameOf(l.compoundId)}
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

      {!plan.fits && <Warning>{t('draw.notFits')}</Warning>}
      {plan.imprecise.length > 0 && (
        <Warning>{t('draw.imprecise', { names: plan.imprecise.map(nameOf).join(', ') })}</Warning>
      )}
      {plan.unknown.length > 0 && (
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
