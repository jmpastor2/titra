import { clsx } from 'clsx'
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Meter } from '@/components/kpi/Meter'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { REORDER_DAYS } from './alerts'
import { coverGauge, supplyTone, TONE_COLOR } from './stockKpis'
import type { RestockLine } from './vials'

const VALUE_TONE = { ok: 'text-ink', warn: 'text-warn', danger: 'text-danger' } as const

/**
 * Supply per substance in use, across every vial: one row each with the days it lasts, a
 * gauge with the order point, and a button to add a vial when it arrives.
 */
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
    <Card title={t('inventory.restockTitle')} className="mb-3">
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((l) => {
          const days = l.runway.runsOutAt
            ? Math.max(0, differenceInCalendarDays(l.runway.runsOutAt, today))
            : null
          const tone = supplyTone(days)
          const names = l.partners.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
          const stock = [
            `${fmtNumber(l.availableMg, locale, 2)} mg`,
            t('inventory.vialsCount', { count: l.vials }),
            ...(l.reserve > 0 ? [t('inventory.reserveCount', { count: l.reserve })] : []),
          ].join(' · ')
          return (
            <li key={l.compoundId} className="flex items-start gap-2 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-2">
                    <span className="mt-[6px] flex">
                      <SubstanceDot color={compoundColor(l.compoundId)} />
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-snug">{names}</span>
                  </span>
                  <span
                    className={clsx(
                      'readout shrink-0 whitespace-nowrap text-[20px] font-semibold leading-tight',
                      VALUE_TONE[tone],
                    )}
                  >
                    {days === null ? t('inventory.kpi.plentyValue') : days}
                    <span className="ml-1 font-sans text-[12.5px] font-medium text-muted">
                      {days === null
                        ? t('inventory.kpi.plentyUnit')
                        : t('inventory.kpi.dayUnit', { count: days })}
                    </span>
                  </span>
                </div>
                <p className="mt-0.5 pl-4 text-[12.5px] leading-snug text-muted">
                  {tone === 'danger' && (
                    <span className="font-semibold text-danger">{t('inventory.orderNow')} · </span>
                  )}
                  {l.runway.runsOutAt
                    ? `${t('inventory.until', {
                        date: fmtDate(l.runway.runsOutAt, locale, 'd MMM'),
                      })} · ${t('inventory.dosesLeft', { count: l.runway.doses })}${
                        l.runway.limitedBy === 'expiry'
                          ? ` · ${t('inventory.endsByExpiry', {
                              mg: fmtNumber(l.runway.wastedMg ?? 0, locale, 2),
                            })}`
                          : ''
                      }`
                    : t('inventory.plenty')}
                </p>
                <p className="readout pl-4 text-[12px] leading-snug text-muted">{stock}</p>
                <Meter
                  className="mt-2.5"
                  height={5}
                  value={coverGauge(days)}
                  max={1}
                  target={coverGauge(REORDER_DAYS)}
                  color={TONE_COLOR[tone]}
                  label={t('inventory.supplyAria', { names })}
                />
              </div>
              {!readOnly && (
                <button
                  type="button"
                  aria-label={t('inventory.addVialOf', { names })}
                  onClick={() => onAdd(l)}
                  className="-mr-2 -mt-2.5 grid size-11 shrink-0 place-items-center rounded-full text-muted outline-none transition hover:bg-panel-2 hover:text-ink active:scale-95 focus-visible:ring-2 focus-visible:ring-signal/60"
                >
                  <Plus className="size-5" aria-hidden />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
