import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Kpi } from '@/components/kpi/Kpi'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtDoseList, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { IN_USE_DAYS } from './alerts'
import type { ReconstitutionPreview } from './reconstitute'
import { fmtPerUnit, fmtUnits } from './vialFormat'

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id
const unitOf = (id: string) => compoundById(id)?.defaultUnit ?? 'mg'

/**
 * What the water gives, live: the concentration as the one big number, then what one
 * syringe unit holds of each compound, the units for the doses being taken now and when to
 * discard the vial. Plain rows under a divider, no box of its own.
 */
export function ReconstitutionResult({
  preview,
  waterMl,
  discard,
}: {
  preview: ReconstitutionPreview | null
  waterMl: number
  /** The date to discard it by, and whether it is only the usual in-use period. */
  discard: { date: Date; estimated: boolean } | null
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  return (
    <section aria-label={t('reconstitute.result')} className="mt-2 border-t border-line pt-4">
      {!preview ? (
        <>
          <span className="spec">{t('reconstitute.result')}</span>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            {t('reconstitute.resultEmpty')}
          </p>
        </>
      ) : (
        <>
          <Kpi
            label={t('reconstitute.concentration')}
            value={fmtNumber(preview.concentration, locale, preview.concentration >= 10 ? 1 : 2)}
            unit="mg/mL"
            tone="signal"
            caption={`${t('reconstitute.inWater', { water: `${fmtNumber(waterMl, locale, 2)} mL` })} · U-100`}
          />

          <dl className="mt-1 divide-y divide-line">
            <Row label={t('reconstitute.perUnit')}>
              <ul className="flex flex-col gap-1.5">
                {preview.compounds.map((c) => (
                  <li key={c.compoundId} className="flex items-start gap-2 text-[14px]">
                    <span className="mt-[7px] flex">
                      <SubstanceDot color={compoundColor(c.compoundId)} size={7} />
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{nameOf(c.compoundId)}</span>
                    <span className="readout shrink-0 font-semibold">
                      {fmtPerUnit(c.mgPerUnit, unitOf(c.compoundId), locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </Row>

            <Row label={t('reconstitute.yourDose')}>
              {preview.draws.length === 0 ? (
                <p className="text-[13px] text-muted">{t('reconstitute.noDoses')}</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {preview.draws.map((d) => (
                    <li key={d.protocolId} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium leading-snug">
                          {d.protocolName}
                        </span>
                        <span className="readout block text-[12px] leading-snug text-muted">
                          {fmtDoseList(
                            d.parts.map((p) => ({ valueMg: p.doseMg, unit: unitOf(p.compoundId) })),
                            locale,
                          )}
                        </span>
                      </span>
                      <span className="readout shrink-0 text-[22px] font-semibold leading-none text-signal">
                        {fmtUnits(d.units, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Row>

            {discard && (
              <Row label={t('reconstitute.discard')}>
                <div className="readout text-[16px] font-semibold">
                  {discard.estimated ? '≈ ' : ''}
                  {fmtDate(discard.date, locale, 'EEE d MMM')}
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">
                  {discard.estimated
                    ? t('reconstitute.discardEstimated', { days: IN_USE_DAYS })
                    : t('reconstitute.discardLabel')}
                </p>
              </Row>
            )}
          </dl>
        </>
      )}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3 last:pb-0">
      <dt className="spec mb-1.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
