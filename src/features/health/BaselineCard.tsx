/**
 * Wellbeing against the first check-in: one 0–10 track per dimension with the starting
 * point marked and the latest score filled in. With a single check-in it is simply the
 * baseline, so the first minute spent already produces something to look at.
 */
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { meanScore, type DimensionBaseline } from './baseline'
import { ChangeValue } from './ProgressCharts'

const SCORE_THRESHOLD = 0.5

export function BaselineCard({ rows }: { rows: readonly DimensionBaseline[] }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const first = rows[0]
  if (!first) return null
  const compare = rows.some((r) => r.delta !== null)
  const baseAt = rows.reduce((a, r) => (r.baselineAt < a ? r.baselineAt : a), first.baselineAt)
  const lastAt = rows.reduce((a, r) => (r.latestAt > a ? r.latestAt : a), first.latestAt)
  const mean = meanScore(rows.map((r) => (compare ? r.latest : r.baseline)))

  return (
    <Card
      instrument
      eyebrow={t('progress.baseline.eyebrow')}
      title={compare ? t('progress.baseline.titleCompare') : t('progress.baseline.title')}
      subtitle={
        compare
          ? t('progress.baseline.compare', {
              latest: fmtDate(lastAt, locale, 'd MMM'),
              base: fmtDate(baseAt, locale, 'd MMM'),
            })
          : t('progress.baseline.single', { date: fmtDate(baseAt, locale, 'd MMM') })
      }
      action={
        mean !== null && (
          <div className="text-right">
            <div className="spec">{t('progress.baseline.mean')}</div>
            <div className="readout mt-1 text-[20px] font-semibold leading-none text-signal">
              {fmtNumber(mean, locale, 1)}
              <span className="text-[11px] text-muted">/10</span>
            </div>
          </div>
        )
      }
    >
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const value = compare ? r.latest : r.baseline
          return (
            <li key={r.kind} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2.5">
              <span className="text-[12.5px] leading-tight text-ink-2">
                {t(`health.kinds.${r.kind}`)}
              </span>
              <span className="relative h-2 rounded-full bg-panel-3" aria-hidden>
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-signal"
                  style={{ width: `${Math.min(100, Math.max(0, value * 10))}%` }}
                />
                {compare && (
                  <span
                    className="absolute -top-1 h-4 w-[2px] -translate-x-1/2 rounded-full bg-ink"
                    style={{ left: `${Math.min(100, Math.max(0, r.baseline * 10))}%` }}
                  />
                )}
              </span>
              <span className="flex min-w-[4.5rem] items-baseline justify-end gap-1.5">
                <span className="readout text-[13px] font-semibold text-ink">
                  {fmtNumber(value, locale, 1)}
                </span>
                {r.delta !== null ? (
                  <ChangeValue
                    kind={r.kind}
                    delta={r.delta}
                    digits={1}
                    threshold={SCORE_THRESHOLD}
                    trim
                    className="text-[11.5px]"
                  />
                ) : (
                  compare && <span className="readout text-[11.5px] text-muted">—</span>
                )}
              </span>
              {r.delta !== null && (
                <span className="sr-only">
                  {t('progress.baseline.srCompare', {
                    base: fmtNumber(r.baseline, locale, 1),
                    latest: fmtNumber(r.latest, locale, 1),
                  })}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {compare && <p className="mt-3 text-[11.5px] text-muted">{t('progress.baseline.legend')}</p>}
    </Card>
  )
}
