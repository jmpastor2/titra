import { differenceInCalendarDays, startOfDay } from 'date-fns'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import type { RestockLine } from './vials'

/** The supply gauge is full at this many days ahead. */
const GAUGE_DAYS = 90

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
            ? differenceInCalendarDays(l.runway.runsOutAt, today)
            : null
          const urgent = days !== null && days <= 14
          const soon = days !== null && days <= 30
          const names = l.partners.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
          const tone = urgent ? 'var(--danger)' : soon ? 'var(--warn)' : 'var(--signal)'
          const gauge = days === null ? 1 : Math.max(0.04, Math.min(1, days / GAUGE_DAYS))
          return (
            <li key={l.compoundId} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-[5px] flex">
                      <SubstanceDot color={compoundColor(l.compoundId)} size={10} />
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-snug">{names}</span>
                  </div>
                  <div className="readout mt-0.5 pl-5 text-[13px] font-semibold leading-snug">
                    {l.runway.runsOutAt ? (
                      <>
                        <span className={urgent ? 'text-danger' : soon ? 'text-warn' : 'text-ink'}>
                          {t('inventory.until', {
                            date: fmtDate(l.runway.runsOutAt, locale, 'd MMM'),
                          })}
                        </span>
                        <span
                          className={`spec ml-2 align-middle text-[9.5px] ${urgent ? 'text-danger' : ''}`}
                        >
                          {urgent
                            ? t('inventory.orderNow')
                            : t('inventory.dosesLeft', { count: l.runway.doses })}
                        </span>
                      </>
                    ) : (
                      <span className="text-signal">{t('inventory.plenty')}</span>
                    )}
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
                className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-panel-3"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${gauge * 100}%`, background: tone }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
