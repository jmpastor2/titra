import { differenceInCalendarDays, startOfDay } from 'date-fns'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { coverGauge, supplyTone, TONE_COLOR } from './stockKpis'
import type { RestockLine } from './vials'

/** Supply per substance in use, across every vial: when to order more, and add it when it arrives. */
export function RestockCard({
  lines,
  now,
  readOnly,
  onAdd,
}: {
  lines: readonly RestockLine[]
  now: Date
  readOnly: boolean
  onAdd: (line: RestockLine) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const today = startOfDay(now)

  return (
    <Card
      instrument
      eyebrow={t('inventory.restockEyebrow')}
      title={t('inventory.restockTitle')}
      className="mb-3"
    >
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((l) => {
          const days = l.runway.runsOutAt
            ? Math.max(0, differenceInCalendarDays(l.runway.runsOutAt, today))
            : null
          const tone = supplyTone(days)
          const names = l.partners.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
          return (
            <li key={l.compoundId} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-[5px] flex">
                      <SubstanceDot color={compoundColor(l.compoundId)} size={10} />
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-snug">{names}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-5">
                    <span
                      className="readout flex items-baseline gap-1.5 leading-none"
                      style={{ color: tone === 'ok' ? undefined : TONE_COLOR[tone] }}
                    >
                      <span className="text-[24px] font-semibold">
                        {days === null ? t('inventory.kpi.plentyValue') : days}
                      </span>
                      <span className="text-[12.5px] font-semibold">
                        {days === null
                          ? t('inventory.kpi.plentyUnit')
                          : t('inventory.kpi.dayUnit', { count: days })}
                      </span>
                    </span>
                    {tone === 'danger' && <Badge tone="danger">{t('inventory.orderNow')}</Badge>}
                  </div>
                  <div className="mt-1 pl-5 text-[13px] leading-snug text-ink-2">
                    {l.runway.runsOutAt
                      ? `${t('inventory.until', {
                          date: fmtDate(l.runway.runsOutAt, locale, 'd MMM'),
                        })} · ${t('inventory.dosesLeft', { count: l.runway.doses })}`
                      : t('inventory.plenty')}
                  </div>
                  <div className="readout mt-0.5 pl-5 text-[11.5px] leading-snug text-muted">
                    {fmtNumber(l.availableMg, locale, 2)} mg ·{' '}
                    {t('inventory.vialsCount', { count: l.vials })}
                    {l.reserve > 0 && ` · ${t('inventory.reserveCount', { count: l.reserve })}`}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    aria-label={t('inventory.addVialOf', { names })}
                    onClick={() => onAdd(l)}
                    className="-mr-1 grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-signal outline-none transition hover:border-signal/50 hover:bg-signal-soft active:scale-95 focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    <Plus className="size-5" aria-hidden />
                  </button>
                )}
              </div>
              <div
                role="img"
                aria-label={t('inventory.supplyAria', { names })}
                className="mt-3 h-[5px] overflow-hidden rounded-full bg-panel-3"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0.04, coverGauge(days)) * 100}%`,
                    background: TONE_COLOR[tone],
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
