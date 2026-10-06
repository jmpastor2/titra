/**
 * "Constancia": am I on track? The adherence of the last 28 days against a 90 % mark (and against
 * the 28 days before, when there were any), the streak of days with every dose taken and the best
 * one, then the calendar of the last twelve weeks.
 */
import { useTranslation } from 'react-i18next'
import { Delta, Kpi, type KpiTone } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { AdherenceHeatmap } from './AdherenceHeatmap'
import type { AdherenceTotal, DoseStreaks } from './consistency'
import { HEAT_WEEKS, type HeatGrid } from './heatmap'

/** The mark the bar is measured against: below it, doses are being missed often enough to matter. */
const TARGET = 0.9

function tone(ratio: number): { kpi: KpiTone; color: string } {
  if (ratio >= TARGET) return { kpi: 'default', color: 'var(--signal)' }
  if (ratio >= 0.7) return { kpi: 'warn', color: 'var(--warn)' }
  return { kpi: 'danger', color: 'var(--danger)' }
}

export function ConsistencyCard({
  grid,
  streaks,
  last28,
  prev28,
  hasProtocols,
}: {
  grid: HeatGrid
  streaks: DoseStreaks
  last28: AdherenceTotal
  /** The 28 days before, for the change; nothing when nothing was due then. */
  prev28?: AdherenceTotal
  hasProtocols: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const title = t('progress.consistency.title')

  if (!hasProtocols) {
    return (
      <section className="card fade-up p-4" aria-label={title}>
        <h3 className="spec">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
          {t('progress.consistency.empty')}
        </p>
      </section>
    )
  }

  const ratio = last28.ratio
  const points =
    ratio !== null && prev28?.ratio != null
      ? Math.round(ratio * 100) - Math.round(prev28.ratio * 100)
      : null

  return (
    <section className="card fade-up p-4" aria-label={title}>
      {ratio === null ? (
        <>
          <h3 className="spec">{t('progress.consistency.adherence')}</h3>
          <p className="mt-1.5 text-[13px] text-ink-2">{t('progress.summary.noDoses')}</p>
        </>
      ) : (
        <Kpi
          label={t('progress.consistency.adherence')}
          value={fmtNumber(Math.round(ratio * 100), locale, 0)}
          unit="%"
          tone={tone(ratio).kpi}
          aside={
            points !== null && (
              <Delta
                text={t('progress.consistency.points', {
                  n: `${points > 0 ? '+' : points < 0 ? '−' : ''}${Math.abs(points)}`,
                })}
                direction={points > 0 ? 'up' : points < 0 ? 'down' : 'flat'}
                tone={points > 0 ? 'good' : points < 0 ? 'bad' : 'neutral'}
              />
            )
          }
          caption={t('charts.adherence.hint', { taken: last28.taken, expected: last28.expected })}
        >
          <Meter
            value={ratio * 100}
            max={100}
            target={TARGET * 100}
            color={tone(ratio).color}
            label={`${t('progress.consistency.adherence')}: ${fmtPercent(ratio, locale)}`}
          />
        </Kpi>
      )}

      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        <Streak label={t('progress.consistency.streak')} count={streaks.current} />
        <Streak label={t('progress.consistency.best')} count={streaks.best} />
      </p>

      <div className="mt-4 border-t border-line pt-3.5">
        <h3 className="spec mb-2">{t('progress.consistency.calendar', { n: HEAT_WEEKS })}</h3>
        <AdherenceHeatmap grid={grid} />
      </div>
    </section>
  )
}

function Streak({ label, count }: { label: string; count: number }) {
  const { t } = useTranslation()
  return (
    <span>
      {label}{' '}
      <span className="readout font-semibold text-ink">
        {count} {t('progress.consistency.days', { count })}
      </span>
    </span>
  )
}
