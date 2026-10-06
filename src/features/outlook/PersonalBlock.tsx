/**
 * The person's own weight trend on "Futuro" when no protocol has a trial to set it against: where
 * the line would go by the horizon if it went straight on, or why it is not drawn yet.
 */
import { Badge } from '@/components/ui/primitives'
import {
  isProjection,
  MAX_EXTRAPOLATION_RATIO,
  MIN_TREND_POINTS,
  MIN_TREND_SPAN_DAYS,
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
        <div className="readout mt-2 text-[34px] font-semibold leading-none">
          {f.weightDelta(projection.deltaKg)}
        </div>
        <div className="readout mt-2 text-[12.5px] text-muted">
          {f.pct(projection.deltaPct)} · ≈ {f.weight(projection.kg)}
        </div>
        <Badge
          tone={projection.reliability === 'weak' ? 'warn' : 'neutral'}
          className="mt-2 whitespace-normal! text-left leading-snug"
        >
          {projection.reliability === 'weak'
            ? t('outlook.personal.badgeWeak')
            : t('outlook.personal.badge')}
        </Badge>
      </>
    )
  }
  return (
    <>
      <div className="mt-1.5 text-[17px] font-semibold">
        {t(`outlook.personal.short.${projection.none}`)}
      </div>
      {trend && (
        <div className="readout mt-1 text-[12.5px] text-muted">
          {t('outlook.personal.soFar', {
            kg: f.weightDelta(trend.latest.kg - trend.baseline.kg),
            pct: f.pct(trend.changePct),
          })}
        </div>
      )}
      {projection.none === 'need_more' && (
        <div className="mt-1 text-[12.5px] text-muted">
          {t('outlook.personal.needMoreHint', { n: MIN_TREND_POINTS, days: MIN_TREND_SPAN_DAYS })}
        </div>
      )}
      {projection.none === 'too_far' && trend && (
        <div className="mt-1 text-[12.5px] text-muted">
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
