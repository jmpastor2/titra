import { clsx } from 'clsx'
import { addDays, subDays } from 'date-fns'
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Ring } from '@/components/kpi/Ring'
import { Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { exposureCurve } from '@/domain/pk/engine'
import { projectPlanned } from '@/domain/pk/scenarios'
import { amountIn } from '@/features/exposure/chartScale'
import { curveToNow } from '@/features/exposure/curves'
import {
  doseDays,
  levelKind,
  nextLine,
  sparkline,
  upcomingDoses,
  vialIsLow,
  type DayCell,
  type DayState,
  type Spark,
} from '@/features/exposure/levelSummary'
import type { CompoundExposure } from '@/features/exposure/useExposure'
import { fmtAgo } from '@/features/exposure/relative'
import { fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** The trace's own box: the card is as wide as the screen, so the drawing is too. */
const SPARK = { width: 300, height: 36, pad: 4 }
const PAST_DAYS = 10
const AHEAD_DAYS = 4
const STRIP_DAYS = 14

/**
 * One substance in the levels list of Hoy. Long-acting compounds show the amount on board, how
 * far that is toward the steady level of the plan and a 14-day trace (10 days back, 4
 * projected) with the current point lit; everything else shows when it was last taken and a
 * 14-day strip of its administrations. Both end with when the next one is, and warn when the
 * vial it comes from runs low.
 */
export function LevelCard({
  x,
  vial,
  title,
}: {
  x: CompoundExposure
  vial: InventoryRow | undefined
  /** The entry's clock is `x.asOf`; the prop stays so existing callers keep compiling. */
  now?: Date
  /** Overrides the compound name, e.g. a blend shown as one card. */
  title?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const now = x.asOf
  const color = compoundColor(x.compoundId)
  const kind = levelKind(x)
  const unit = x.compound?.defaultUnit ?? 'mg'

  const spark = useMemo(() => {
    if (kind !== 'curve' || !x.pk) return null
    const from = subDays(now, PAST_DAYS)
    const to = addDays(now, AHEAD_DAYS)
    const history = curveToNow(
      exposureCurve(x.history, x.pk, { from, to: now, stepH: 6, refineAtDoses: true }),
      now,
      x.nowMg ?? 0,
    )
    const projection = projectPlanned({
      compoundId: x.compoundId,
      pk: x.pk,
      history: x.history,
      protocol: x.protocolLike,
      now,
      horizonDays: AHEAD_DAYS,
      stepH: 6,
    }).points
    return sparkline(history, projection, x.history, from, to, SPARK)
  }, [kind, x, now])

  const days = useMemo(
    () => (kind === 'timeline' ? doseDays(x.history, x.protocolLike, now, STRIP_DAYS) : null),
    [kind, x.history, x.protocolLike, now],
  )
  const low = useMemo(
    () => (vial ? vialIsLow(vial, x.compoundId, upcomingDoses(x, now), now) : false),
    [vial, x, now],
  )

  const amount = kind === 'curve' && x.nowMg !== null ? amountIn(x.nowMg, unit) : null
  const steady = x.progress ? fmtPercent(Math.min(x.progress.fraction, 1.5), locale) : null
  const next = nextLine(x.next, now)
  const lastText = x.lastDose ? fmtAgo(x.lastDose.at, now, locale, t('levels.justNow')) : '—'
  const fill =
    vial && Number(vial.total_mg) > 0 ? Number(vial.remaining_mg) / Number(vial.total_mg) : 0
  const vialText = !vial
    ? t('levels.vial.none')
    : low
      ? t('levels.vial.low')
      : t('levels.vial.left', { pct: fmtPercent(Math.max(0, Math.min(1, fill)), locale) })
  const stripTaken = days?.filter((d) => d.state === 'taken' || d.state === 'late').length ?? 0
  const stripExpected =
    days?.filter((d) => d.state === 'taken' || d.state === 'late' || d.state === 'missed').length ??
    0
  const dots = [x.compoundId, ...x.partners.map((p) => p.compoundId)]

  return (
    <Link
      to={`/substance/${x.compoundId}`}
      className="card block p-4 transition active:scale-[0.99]"
      style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="mt-[7px] flex shrink-0 items-center gap-1" aria-hidden>
              {dots.map((id) => (
                <SubstanceDot key={id} color={compoundColor(id)} />
              ))}
            </span>
            <span className="min-w-0 break-words text-[15px] font-semibold leading-snug">
              {title ?? x.title}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {amount ? (
              <>
                <span className="readout text-[26px] font-semibold leading-none">
                  {fmtNumber(amount.value, locale, amount.digits)}
                  <span className="ml-1 text-[12px] font-medium text-muted">{amount.label}</span>
                </span>
                <span className="text-[12.5px] text-muted">{t('levels.onBoard')}</span>
              </>
            ) : (
              <>
                <span className="readout text-[20px] font-semibold leading-none">{lastText}</span>
                <span className="text-[12.5px] text-muted">
                  {x.lastDose ? t('levels.lastDose') : t('levels.noDoses')}
                </span>
              </>
            )}
          </div>
        </div>
        {amount && x.progress ? (
          <Gauge
            fraction={x.progress.fraction}
            color={color}
            label={t('levels.steady')}
            aria={t('levels.steadyAria', { pct: steady })}
          >
            {steady}
          </Gauge>
        ) : days && stripExpected > 0 ? (
          <Gauge
            fraction={stripTaken / stripExpected}
            color={color}
            label={t('levels.strip.span', { n: days.length })}
            aria={t('levels.strip.aria', {
              taken: stripTaken,
              planned: stripExpected,
              days: days.length,
            })}
          >
            {stripTaken}/{stripExpected}
          </Gauge>
        ) : null}
      </div>

      <div className="mt-3">
        {spark ? (
          <Sparkline
            spark={spark}
            color={color}
            label={t('levels.spark.aria', { past: PAST_DAYS, ahead: AHEAD_DAYS })}
          />
        ) : days ? (
          <>
            <DayStrip days={days} color={color} taken={stripTaken} expected={stripExpected} />
            <StripLegend days={days} color={color} />
          </>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-[12.5px] leading-snug">
        <span
          className={clsx(
            next?.kind === 'overdue'
              ? 'font-semibold text-danger'
              : next?.kind === 'due'
                ? 'font-semibold text-warn'
                : 'text-muted',
          )}
        >
          {next
            ? next.kind === 'overdue'
              ? t('levels.overdue', { time: fmtHours(next.hours, locale) })
              : next.kind === 'due'
                ? t('levels.dueNow')
                : t('levels.nextIn', { time: fmtHours(next.hours, locale) })
            : x.protocol
              ? ' '
              : t('levels.noPlan')}
        </span>
        <span className={clsx('text-right', low ? 'font-semibold text-warn' : 'sr-only')}>
          {vialText}
        </span>
      </div>
    </Link>
  )
}

/** The loading shape, about as tall as a card, so little moves when the levels arrive. */
export function LevelCardSkeleton() {
  return (
    <div className="card flex h-[150px] flex-col gap-2 p-4" aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-1 h-7 w-24" />
      <Skeleton className="mt-2 h-8 w-full" />
      <Skeleton className="mt-auto h-3 w-20" />
    </div>
  )
}

/**
 * A small gauge at the right of the reading: how far toward the steady level, or how many of
 * the planned doses were taken, with what it measures under it.
 */
function Gauge({
  fraction,
  color,
  label,
  aria,
  children,
}: {
  fraction: number
  color: string
  label: string
  aria: string
  children: ReactNode
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1" title={aria}>
      <Ring value={fraction} size={50} stroke={5} color={color}>
        <span className="readout text-[11px] font-semibold text-ink">{children}</span>
      </Ring>
      <span className="spec text-[9px]" aria-hidden>
        {label}
      </span>
      <span className="sr-only">{aria}</span>
    </div>
  )
}

function Sparkline({ spark, color, label }: { spark: Spark; color: string; label: string }) {
  const gradId = `lvl-${useId().replace(/\W/g, '')}`
  const area = spark.history
    ? `${spark.history} L${spark.now?.x ?? 0} ${spark.baselineY} L${SPARK.pad} ${spark.baselineY} Z`
    : ''
  return (
    <svg
      viewBox={`0 0 ${SPARK.width} ${SPARK.height}`}
      className="w-full overflow-visible"
      role="img"
      aria-label={label}
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

/**
 * How a day of the strip reads: filled when taken, with an amber top when off the hour, a
 * diamond for an extra, a red outline when missed, a hollow cell while today's is pending.
 */
function DayMark({
  state,
  color,
  className,
}: {
  state: DayState
  color: string
  className: string
}) {
  if (state === 'extra') {
    return (
      <span className={clsx('inline-flex items-center justify-center', className)}>
        <span
          className="size-[60%] min-w-[6px] rotate-45 rounded-[1.5px] ring-1 ring-accent"
          style={{ background: color }}
        />
      </span>
    )
  }
  const look: { className: string; style?: CSSProperties } =
    state === 'taken'
      ? { className: '', style: { background: color } }
      : state === 'late'
        ? { className: 'border-t-[3px] border-warn', style: { background: color } }
        : state === 'missed'
          ? { className: 'border border-danger/70 bg-danger-soft' }
          : state === 'planned'
            ? { className: 'border-[1.5px] bg-panel', style: { borderColor: color } }
            : { className: 'bg-panel-3' }
  return (
    <span
      className={clsx('inline-block rounded-[3px]', look.className, className)}
      style={look.style}
    />
  )
}

function DayStrip({
  days,
  color,
  taken,
  expected,
}: {
  days: DayCell[]
  color: string
  taken: number
  expected: number
}) {
  const { t } = useTranslation()
  return (
    <div
      role="img"
      aria-label={t('levels.strip.aria', { taken, planned: expected, days: days.length })}
      className="flex h-4 items-center gap-[3px]"
    >
      {days.map((d) => (
        <DayMark
          key={d.day.getTime()}
          state={d.state}
          color={color}
          className="h-4 min-w-0 flex-1"
        />
      ))}
    </div>
  )
}

/** Only what needs explaining: the states other than plain taken that this strip shows. */
const LEGEND_ORDER: readonly DayState[] = ['missed', 'late', 'extra', 'planned']

function StripLegend({ days, color }: { days: DayCell[]; color: string }) {
  const { t } = useTranslation()
  const shown = LEGEND_ORDER.filter((s) => days.some((d) => d.state === s)).slice(0, 3)
  if (shown.length === 0) return null
  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted"
      aria-hidden
    >
      {shown.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <DayMark state={s} color={color} className="size-3 shrink-0" />
          {t(`levels.strip.${s}`)}
        </span>
      ))}
    </div>
  )
}
