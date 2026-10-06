import { clsx } from 'clsx'
import { format, isSameDay } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { DEFAULT_ROTATION, INJECTION_SITES, type SiteUse } from '@/domain/sites/injectionSites'
import { siteTimeline } from '@/domain/sites/rotation'
import { useLocale } from '@/lib/useLocale'
import { CompoundNames } from './SiteDetail'

/**
 * Sites × last 14 days. Each dot is one injection in its substance colour (the legend
 * names them); a number marks several injections at one site on one day.
 */
export function SiteTimeline({ history, now }: { history: readonly SiteUse[]; now: Date }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dfLocale = locale === 'es' ? es : enUS
  const days = useMemo(() => siteTimeline(history, now), [history, now])

  const { rows, compounds } = useMemo(() => {
    const used = new Set(days.flatMap((d) => d.injections.map((i) => i.siteId)))
    const ids = [
      ...INJECTION_SITES.map((s) => s.id).filter(
        (id) => DEFAULT_ROTATION.includes(id) || used.has(id),
      ),
      ...[...used].filter((id) => !INJECTION_SITES.some((s) => s.id === id)),
    ]
    const seen = new Set(days.flatMap((d) => d.injections.flatMap((i) => i.compoundIds)))
    return { rows: ids, compounds: [...seen] }
  }, [days])

  const total = days.reduce((n, d) => n + d.injections.length, 0)
  if (total === 0) return <p className="text-[13px] text-muted">{t('sites.timelineEmpty')}</p>

  return (
    <div className="space-y-3">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{t('sites.timeline')}</caption>
        <colgroup>
          <col className="w-[60px]" />
          {days.map((d) => (
            <col key={d.date.getTime()} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              {t('sites.title')}
            </th>
            {days.map((d) => {
              const today = isSameDay(d.date, now)
              return (
                <th
                  key={d.date.getTime()}
                  scope="col"
                  aria-label={format(d.date, 'PPPP', { locale: dfLocale })}
                  className={clsx(
                    'readout pb-1 text-center text-[10px] font-medium leading-tight',
                    today ? 'text-signal' : 'text-muted',
                  )}
                >
                  <div aria-hidden>{format(d.date, 'EEEEE', { locale: dfLocale })}</div>
                  <div aria-hidden className="tabular">
                    {format(d.date, 'd')}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((siteId) => (
            <tr key={siteId} className="border-t border-line">
              <th
                scope="row"
                className="py-1.5 pr-1 text-left text-[11px] font-medium leading-tight text-ink-2"
              >
                {t(`sites.short.${siteId}`, { defaultValue: t(`sites.labels.${siteId}`) })}
              </th>
              {days.map((d) => {
                const here = d.injections.filter((i) => i.siteId === siteId)
                const first = here[0]
                const today = isSameDay(d.date, now)
                const names = here.flatMap((i) => i.compoundIds.map(compoundName)).join(', ')
                return (
                  <td
                    key={d.date.getTime()}
                    className={clsx('p-0 text-center', today && 'bg-signal-soft')}
                    title={names || undefined}
                  >
                    {first && (
                      <span
                        className="relative mx-auto inline-flex size-[11px] items-center justify-center rounded-full align-middle"
                        style={{
                          background: first.compoundIds[0]
                            ? compoundColor(first.compoundIds[0])
                            : 'var(--ink-2)',
                        }}
                      >
                        <span className="sr-only">{names || t('sites.injected')}</span>
                        {here.length > 1 && (
                          <span
                            aria-hidden
                            className="readout text-[8px] font-bold leading-none text-[var(--panel)]"
                          >
                            {here.length}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {compounds.length > 0 && <CompoundNames ids={compounds} className="text-[12px] text-muted" />}
    </div>
  )
}
