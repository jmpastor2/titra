/**
 * The person's own weight trend on "Futuro" when no protocol has a trial to set it against: where
 * he is so far, and where the line would go if it went straight on, or why it is not drawn yet.
 */
import { Scale } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/primitives'
import {
  horizonDate,
  isProjection,
  MAX_EXTRAPOLATION_RATIO,
  MIN_TREND_POINTS,
  MIN_TREND_SPAN_DAYS,
  projectTrend,
  type Horizon,
  type NoProjection,
  type PersonalTrend,
  type Projection,
} from './outlook'
import type { Fmt } from './outlookFormat'

export function PersonalReadout({
  f,
  trend,
  projection,
}: {
  f: Fmt
  trend: PersonalTrend | null
  projection: Projection | { none: NoProjection }
}) {
  const { t } = f
  if (isProjection(projection)) {
    return (
      <>
        <div className="readout mt-1.5 text-[17px] font-semibold leading-tight">
          {f.weightDelta(projection.deltaKg)}
        </div>
        <div className="readout mt-1 text-[11.5px] text-muted">
          {f.pct(projection.deltaPct)} · ≈ {f.weight(projection.kg)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <Badge
            tone={projection.reliability === 'weak' ? 'warn' : 'neutral'}
            className="whitespace-normal! text-left leading-snug"
          >
            {projection.reliability === 'weak'
              ? t('outlook.personal.badgeWeak')
              : t('outlook.personal.badge')}
          </Badge>
        </div>
      </>
    )
  }
  return (
    <>
      <div className="mt-1.5 text-[13px] font-semibold">
        {t(`outlook.personal.short.${projection.none}`)}
      </div>
      {trend && (
        <div className="readout mt-1 text-[11.5px] text-muted">
          {t('outlook.personal.soFar', {
            kg: f.weightDelta(trend.latest.kg - trend.baseline.kg),
            pct: f.pct(trend.changePct),
          })}
        </div>
      )}
      {projection.none === 'need_more' && (
        <div className="mt-1 text-[11.5px] text-muted">
          {t('outlook.personal.needMoreHint', { n: MIN_TREND_POINTS, days: MIN_TREND_SPAN_DAYS })}
        </div>
      )}
      {projection.none === 'too_far' && trend && (
        <div className="mt-1 text-[11.5px] text-muted">
          {t('outlook.personal.until', {
            date: f.date(
              new Date(
                trend.latest.at.getTime() +
                  (trend.latest.at.getTime() - trend.baseline.at.getTime()) *
                    MAX_EXTRAPOLATION_RATIO,
              ),
            ),
          })}
        </div>
      )}
    </>
  )
}

/** Standalone personal KPI when no protocol has a trial reference. */
export function PersonalBlock({
  f,
  trend,
  horizon,
  now,
  readOnly,
  onLogWeight,
}: {
  f: Fmt
  trend: PersonalTrend | null
  horizon: Horizon
  now: Date
  readOnly: boolean
  onLogWeight: () => void
}) {
  const { t } = f
  const projection = projectTrend(trend, horizonDate(now, horizon))
  if (!trend) {
    return (
      <EmptyState
        className="py-6"
        icon={<Scale className="size-6" />}
        title={t('outlook.personal.emptyTitle')}
        description={t('outlook.personal.askWeight')}
        action={
          !readOnly && (
            <Button size="sm" onClick={onLogWeight}>
              {t('outlook.personal.logWeight')}
            </Button>
          )
        }
      />
    )
  }
  return (
    <div>
      <div className="spec">{t('outlook.personal.label')}</div>
      <PersonalReadout f={f} trend={trend} projection={projection} />
    </div>
  )
}
