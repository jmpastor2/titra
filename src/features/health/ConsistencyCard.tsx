/**
 * "Constancia": am I on track? The adherence of the last 28 days, the streak of days with every
 * dose taken, the best one, and the calendar of the last twelve weeks.
 */
import { useTranslation } from 'react-i18next'
import { Ring } from '@/components/kpi/Ring'
import { fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { AdherenceHeatmap } from './AdherenceHeatmap'
import type { AdherenceTotal, DoseStreaks } from './consistency'
import { HEAT_WEEKS, type HeatGrid } from './heatmap'

function ringColor(total: AdherenceTotal): string {
  if (total.ratio === null) return 'var(--muted)'
  return total.ratio >= 0.9 ? 'var(--signal)' : total.ratio >= 0.7 ? 'var(--warn)' : 'var(--danger)'
}

export function ConsistencyCard({
  grid,
  streaks,
  last28,
  hasProtocols,
}: {
  grid: HeatGrid
  streaks: DoseStreaks
  last28: AdherenceTotal
  hasProtocols: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const title = t('progress.consistency.eyebrow', { n: HEAT_WEEKS })
  const percent = last28.ratio === null ? null : fmtPercent(last28.ratio, locale)

  return (
    <section className="card fade-up p-3.5" aria-label={title}>
      <h3 className="spec">{title}</h3>

      {hasProtocols ? (
        <>
          <div className="mt-3 grid grid-cols-[auto_1fr_1fr] items-center gap-x-4">
            <div className="flex flex-col items-center gap-1.5">
              <Ring
                value={last28.ratio ?? 0}
                size={60}
                stroke={6}
                color={ringColor(last28)}
                label={percent ? `${t('progress.consistency.ring')}: ${percent}` : undefined}
              >
                <span className="readout text-[14px] font-semibold leading-none">
                  {percent ?? '—'}
                </span>
              </Ring>
              <span className="whitespace-nowrap text-[11px] leading-none text-muted">
                {t('progress.consistency.ring')}
              </span>
            </div>
            <Streak count={streaks.current} label={t('progress.consistency.streak')} />
            <Streak count={streaks.best} label={t('progress.consistency.best')} />
          </div>
          <div className="mt-4">
            <AdherenceHeatmap grid={grid} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-[13px] text-muted">{t('progress.consistency.empty')}</p>
      )}
    </section>
  )
}

function Streak({ count, label }: { count: number; label: string }) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0">
      <div className="readout text-[26px] font-semibold leading-none">
        {count}
        <span className="ml-1 text-[12px] font-medium text-muted">
          {t('progress.consistency.days', { count })}
        </span>
      </div>
      <div className="mt-1.5 text-[11.5px] leading-tight text-muted">{label}</div>
    </div>
  )
}
