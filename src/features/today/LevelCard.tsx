import { clsx } from 'clsx'
import { addDays, subDays } from 'date-fns'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Vial } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { exposureCurve } from '@/domain/pk/engine'
import { projectPlanned } from '@/domain/pk/scenarios'
import { scaledAmount } from '@/features/exposure/chartScale'
import {
  doseDays,
  hasMeaningfulCurve,
  sparkline,
  type DayCell,
} from '@/features/exposure/levelSummary'
import type { CompoundExposure } from '@/features/exposure/useExposure'
import { fmtDistance, fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { vialLook } from '@/features/inventory/vials'
import { useLocale } from '@/lib/useLocale'

const SPARK = { width: 140, height: 34, pad: 5 }
const PAST_DAYS = 10
const AHEAD_DAYS = 4
const STRIP_DAYS = 14

/**
 * Compact per-substance instrument on Today. Long-acting compounds show the amount on
 * board and a 14-day trace (10 days back, 4 projected) with the current point lit;
 * everything else shows when it was last taken, when it is next due and a 14-day strip.
 */
export function LevelCard({
  x,
  vial,
  now,
  title,
}: {
  x: CompoundExposure
  vial: InventoryRow | undefined
  now: Date
  /** Overrides the compound name, e.g. a blend shown as one card. */
  title?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const color = compoundColor(x.compoundId)
  const pk = hasMeaningfulCurve(x.pk) && x.nowMg !== null ? x.pk : null

  const spark = useMemo(() => {
    if (!pk) return null
    const from = subDays(now, PAST_DAYS)
    const to = addDays(now, AHEAD_DAYS)
    const history = exposureCurve(x.history, pk, { from, to: now, stepH: 6, refineAtDoses: true })
    const projection = projectPlanned({
      compoundId: x.compoundId,
      pk,
      history: x.history,
      protocol: x.protocolLike,
      now,
      horizonDays: AHEAD_DAYS,
      stepH: 6,
    }).points
    return sparkline(history, projection, x.history, from, to, SPARK)
  }, [pk, x.compoundId, x.history, x.protocolLike, now])

  const days = useMemo(
    () => (pk ? null : doseDays(x.history, x.protocolLike, now, STRIP_DAYS)),
    [pk, x.history, x.protocolLike, now],
  )

  const next = x.next
  const nextLabel = next
    ? next.status === 'overdue'
      ? t('today.overdueBy', { time: fmtHours(next.overdueH, locale) })
      : next.status === 'due'
        ? t('today.dueNow')
        : t('charts.level.nextIn', {
            time: fmtHours((next.at.getTime() - now.getTime()) / 3_600_000, locale),
          })
    : null
  const amount = x.nowMg !== null ? scaledAmount(x.nowMg) : null

  return (
    <Link
      to={`/substance/${x.compoundId}`}
      className="card flex w-[168px] shrink-0 flex-col gap-2 p-3.5 transition active:scale-[0.98]"
      style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[13.5px] font-semibold leading-tight">
          {title ?? x.compound?.names.generic ?? x.compoundId}
        </span>
        {vial ? (
          <Vial {...vialLook(vial)} size={30} />
        ) : (
          <Vial color={color} fill={0.001} size={30} className="opacity-40" />
        )}
      </div>

      {pk && amount ? (
        <div>
          <div className="readout text-[22px] font-semibold leading-none text-ink">
            {fmtNumber(amount.value, locale, amount.digits)}
            <span className="ml-1 text-[11px] text-muted">{amount.unit}</span>
          </div>
          <div className="spec mt-1">
            {x.progress
              ? `${t('today.onBoard')} · SS ${fmtPercent(Math.min(1, x.progress.fraction), locale)}`
              : t('today.onBoard')}
          </div>
        </div>
      ) : (
        <div>
          <div className="readout text-[15px] font-semibold leading-tight text-ink">
            {x.lastDose ? fmtDistance(x.lastDose.at, locale) : '—'}
          </div>
          <div className="spec mt-1">{t('today.lastDose')}</div>
        </div>
      )}

      {spark ? (
        <Sparkline spark={spark} color={color} />
      ) : days ? (
        <DayStripMini days={days} color={color} />
      ) : null}

      <div
        className={clsx(
          'truncate text-[11.5px] leading-none',
          next?.status === 'overdue'
            ? 'text-danger'
            : next?.status === 'due'
              ? 'text-warn'
              : 'text-muted',
        )}
      >
        {nextLabel ?? ' '}
      </div>
    </Link>
  )
}

function Sparkline({ spark, color }: { spark: ReturnType<typeof sparkline>; color: string }) {
  const gradId = `lvl-${useId().replace(/:/g, '')}`
  const area = spark.history
    ? `${spark.history} L${spark.now?.x ?? 0} ${spark.baselineY} L${SPARK.pad} ${spark.baselineY} Z`
    : ''
  return (
    <svg
      viewBox={`0 0 ${SPARK.width} ${SPARK.height}`}
      className="h-[34px] w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line
        x1={SPARK.pad}
        x2={SPARK.width - SPARK.pad}
        y1={spark.baselineY}
        y2={spark.baselineY}
        stroke="var(--line-strong)"
        strokeWidth={1}
      />
      {area && <path d={area} fill={`url(#${gradId})`} />}
      {spark.projection && (
        <path
          d={spark.projection}
          fill="none"
          stroke={color}
          strokeOpacity={0.7}
          strokeWidth={1.5}
          strokeDasharray="3 3"
          strokeLinejoin="round"
        />
      )}
      <path
        d={spark.history}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {spark.doses.map((dx) => (
        <line
          key={dx}
          x1={dx}
          x2={dx}
          y1={spark.baselineY}
          y2={spark.baselineY + 3}
          stroke={color}
          strokeWidth={1.5}
        />
      ))}
      {spark.now && (
        <g>
          <circle cx={spark.now.x} cy={spark.now.y} r={6} fill={color} fillOpacity={0.22} />
          <circle
            cx={spark.now.x}
            cy={spark.now.y}
            r={3}
            fill={color}
            stroke="var(--panel)"
            strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
          />
        </g>
      )}
    </svg>
  )
}

function DayStripMini({ days, color }: { days: DayCell[]; color: string }) {
  const { t } = useTranslation()
  const taken = days.filter((d) => d.state === 'taken').length
  const planned = days.filter((d) => d.state !== 'rest').length
  return (
    <div
      role="img"
      aria-label={t('charts.level.stripAria', { taken, planned, days: days.length })}
      className="flex h-[34px] flex-col justify-center gap-1"
    >
      <div className="flex items-center gap-[2px]">
        {days.map((d) => (
          <span
            key={d.day.getTime()}
            className={clsx(
              'h-3 min-w-0 flex-1 rounded-[3px]',
              d.state === 'rest' && 'bg-panel-3',
              d.state === 'missed' && 'border border-danger/70 bg-danger-soft',
              d.state === 'planned' && 'border-[1.5px] bg-panel',
            )}
            style={
              d.state === 'taken'
                ? { background: color }
                : d.state === 'planned'
                  ? { borderColor: color }
                  : undefined
            }
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
        <span>{t('charts.level.daysShort', { n: days.length })}</span>
        <span>{t('common.today')}</span>
      </div>
    </div>
  )
}
