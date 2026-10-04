import { clsx } from 'clsx'
import { addDays, subDays } from 'date-fns'
import { useId, useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Skeleton, Vial } from '@/components/ui/primitives'
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
import { vialLook } from '@/features/inventory/vials'
import { fmtAgo } from '@/features/exposure/relative'
import { fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** Card and trace geometry: every card is the same size, whatever it shows. */
const CARD = 'h-[184px] w-[156px]'
const SPARK = { width: 128, height: 32, pad: 4 }
const PAST_DAYS = 10
const AHEAD_DAYS = 4
const STRIP_DAYS = 14

/**
 * Compact per-substance instrument on Today. Long-acting compounds show the amount on
 * board and a 14-day trace (10 days back, 4 projected) with the current point lit;
 * everything else shows when it was last taken and a 14-day strip of its administrations.
 * Both end with when the next one is, and the vial it comes from wears its stock.
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

  return (
    <Link
      to={`/substance/${x.compoundId}`}
      className={clsx('card flex shrink-0 flex-col p-3.5 transition active:scale-[0.98]', CARD)}
      style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}
    >
      <div className="flex h-8 items-start justify-between gap-2">
        <span className="line-clamp-2 text-[13.5px] font-semibold leading-[1.15]">
          {title ?? x.title}
        </span>
        <span className="mt-px shrink-0">
          {vial ? (
            <Vial {...vialLook(vial)} size={30} low={low} />
          ) : (
            <Vial color={color} fill={0.001} size={30} className="opacity-40" />
          )}
          <span className="sr-only">{vialText}</span>
        </span>
      </div>

      <div className="mt-2 flex h-[40px] flex-col justify-between">
        <div className="readout truncate font-semibold leading-none text-ink">
          {amount ? (
            <span className="text-[22px]">
              {fmtNumber(amount.value, locale, amount.digits)}
              <span className="ml-1 text-[11px] font-medium text-muted">{amount.label}</span>
            </span>
          ) : (
            <span className="text-[16px]">
              {x.lastDose ? fmtAgo(x.lastDose.at, now, locale, t('levels.justNow')) : '—'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 leading-none">
          <span className="spec truncate">
            {amount ? t('levels.onBoard') : x.lastDose ? t('levels.lastDose') : t('levels.noDoses')}
          </span>
          {amount && x.progress ? (
            <span
              className="readout inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ink-2"
              title={t('levels.steadyAria', { pct: steady })}
            >
              <MiniRing fraction={x.progress.fraction} color={color} />
              {steady}
              <span className="sr-only"> {t('levels.steady')}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 h-[30px]">
        {spark ? (
          <Sparkline
            spark={spark}
            color={color}
            label={t('levels.spark.aria', { past: PAST_DAYS, ahead: AHEAD_DAYS })}
          />
        ) : days ? (
          <DayStrip days={days} color={color} taken={stripTaken} expected={stripExpected} />
        ) : null}
      </div>

      <div className="mt-1 h-[10px]">
        {spark ? (
          <SparkCaption spark={spark} />
        ) : days ? (
          <StripCaption days={days} taken={stripTaken} expected={stripExpected} />
        ) : null}
      </div>

      <div className="mt-1 h-[11px]">
        {spark ? (
          <SparkLegend color={color} />
        ) : days ? (
          <StripLegend days={days} color={color} />
        ) : null}
      </div>

      <div
        className={clsx(
          'mt-auto truncate text-[11.5px] leading-none',
          next?.kind === 'overdue'
            ? 'text-danger'
            : next?.kind === 'due'
              ? 'text-warn'
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
      </div>
    </Link>
  )
}

/** The loading shape: same size as the card, so nothing moves when the levels arrive. */
export function LevelCardSkeleton() {
  return (
    <div className={clsx('card flex shrink-0 flex-col gap-2 p-3.5', CARD)} aria-hidden>
      <div className="flex justify-between gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-[30px] w-[19px]" />
      </div>
      <Skeleton className="mt-1 h-9 w-24" />
      <Skeleton className="mt-1 h-[30px] w-full" />
      <Skeleton className="mt-auto h-3 w-20" />
    </div>
  )
}

/** How far toward the steady level the amount on board is: a 12 px gauge next to the figure. */
function MiniRing({ fraction, color }: { fraction: number; color: string }) {
  const r = 4.5
  const c = 2 * Math.PI * r
  const f = Math.max(0, Math.min(1, fraction))
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="-rotate-90" aria-hidden>
      <circle cx="6" cy="6" r={r} fill="none" stroke="var(--panel-3)" strokeWidth="2" />
      <circle
        cx="6"
        cy="6"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - f)}
      />
    </svg>
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
      className="h-[30px] w-full overflow-visible"
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

const CAPTION =
  'relative h-full font-mono text-[8.5px] uppercase leading-[10px] tracking-[0.1em] text-muted'

/** "10 d" at the start and "hoy" under the lit point; the dashed part ahead is in the legend. */
function SparkCaption({ spark }: { spark: Spark }) {
  const { t } = useTranslation()
  return (
    <div className={CAPTION} aria-hidden>
      <span className="absolute left-0">{t('levels.spark.back', { n: PAST_DAYS })}</span>
      <span
        className="absolute -translate-x-1/2"
        style={{ left: `${((spark.now?.x ?? SPARK.width / 2) / SPARK.width) * 100}%` }}
      >
        {t('common.today')}
      </span>
    </div>
  )
}

function StripCaption({
  days,
  taken,
  expected,
}: {
  days: DayCell[]
  taken: number
  expected: number
}) {
  const { t } = useTranslation()
  return (
    <div className={clsx(CAPTION, 'flex justify-between')} aria-hidden>
      <span>
        {expected > 0
          ? t('levels.strip.caption', { n: days.length, taken, expected })
          : t('levels.strip.span', { n: days.length })}
      </span>
      <span>{t('common.today')}</span>
    </div>
  )
}

function SparkLegend({ color }: { color: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5 text-[9px] leading-[11px] text-muted" aria-hidden>
      <span className="inline-flex items-center gap-1">
        <span className="h-[2px] w-3 rounded" style={{ background: color }} />
        {t('levels.spark.real')}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="w-3 border-t-2 border-dotted" style={{ borderColor: color }} />
        {t('levels.spark.planned')}
      </span>
    </div>
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
      <span className={clsx('flex items-center justify-center', className)}>
        <span
          className="size-[55%] min-w-[5px] rotate-45 rounded-[1.5px] ring-1 ring-accent"
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
  return <span className={clsx('rounded-[3px]', look.className, className)} style={look.style} />
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
      className="flex h-full items-center gap-[2px]"
    >
      {days.map((d) => (
        <DayMark
          key={d.day.getTime()}
          state={d.state}
          color={color}
          className="h-3 min-w-0 flex-1"
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
  return (
    <div className="flex items-center gap-2.5 text-[9px] leading-[11px] text-muted" aria-hidden>
      {shown.map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <DayMark state={s} color={color} className="inline-block size-[8px] shrink-0" />
          {t(`levels.strip.${s}`)}
        </span>
      ))}
    </div>
  )
}
