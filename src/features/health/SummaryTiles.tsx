/**
 * The body KPIs of the summary. Weight is the hero: the latest reading, its change since the
 * cycle began, the pace, the line of the last weeks and the way to the goal. Waist and body fat
 * are small ones with their own line. Each answers "is it working?" for one measure.
 */
import { clsx } from 'clsx'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Delta, Kpi } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Spark } from '@/components/kpi/Spark'
import { fmtDate, fmtPercent, type Locale } from '@/lib/format'
import { KIND_DIGITS } from './kinds'
import { changeTone, fmtSignedFixed, fmtSignedPct } from './progress'
import { goalProgress, type baselineChange, type weeklyRate } from './trend'
import { fmtReading, type BodyUnits } from './units'

/** The least a body sparkline zooms in to, in kg, cm or points of fat: two of them are a change. */
const SPARK_MIN_SPAN = 2
/** A weekly rate comes from a fit over a few weigh-ins: a tenth is as fine as it gets. */
const RATE_DIGITS = 1
/** Changes smaller than this read as no change. */
const FLAT = 0.2

/** A summary card: one KPI and, at its top right, an optional small action. */
export function Tile({
  wide = false,
  action,
  className,
  children,
}: {
  wide?: boolean
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'card fade-up relative flex min-w-0 flex-col',
        wide ? 'col-span-2 p-4' : 'p-3.5',
        className,
      )}
    >
      {action && <div className="absolute right-1 top-1">{action}</div>}
      {children}
    </div>
  )
}

export type BodyTileKind = 'weight' | 'waist' | 'body_fat_pct'

export interface BodyData {
  change: ReturnType<typeof baselineChange>
  rate: ReturnType<typeof weeklyRate>
  spark: number[]
}

export function BodyTile({
  kind,
  units,
  label,
  empty,
  data,
  locale,
  color,
  onLog,
  wide = false,
  goal,
  className,
}: {
  kind: BodyTileKind
  units: BodyUnits
  label: string
  empty: string
  data: BodyData
  locale: Locale
  color: string
  onLog?: () => void
  wide?: boolean
  /** The goal in the person's unit, when there is one. */
  goal?: number | null
  className?: string
}) {
  const { t } = useTranslation()
  const { change, rate } = data
  const unit = units.unit(kind)
  const action = onLog && (
    <button
      type="button"
      onClick={onLog}
      aria-label={t('progress.summary.log', { what: label.toLowerCase() })}
      className="grid size-11 place-items-center rounded-full text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <Plus className="size-4" />
    </button>
  )

  if (!change) {
    return (
      <Tile wide={wide} action={action} className={className}>
        <span className="spec pr-8">{label}</span>
        <p className="mt-1.5 pr-6 text-[13px] leading-snug text-ink-2">{empty}</p>
      </Tile>
    )
  }

  const { delta, baseline } = change
  const digits = KIND_DIGITS[kind]
  // With a goal, good news is moving toward it (a weight goal can be above the start too).
  const tone =
    delta === null
      ? 'neutral'
      : goal != null && Math.abs(delta) >= FLAT
        ? Math.sign(goal - (change.latest.value - delta)) === Math.sign(delta)
          ? 'good'
          : 'bad'
        : changeTone(kind, delta, FLAT)
  const aside =
    delta !== null && baseline ? (
      <Delta
        text={`${fmtSignedFixed(delta, locale, digits)} ${unit}`}
        direction={Math.abs(delta) < FLAT ? 'flat' : delta < 0 ? 'down' : 'up'}
        tone={tone}
      />
    ) : undefined
  const since = baseline
    ? [
        change.pct !== null && fmtSignedPct(change.pct * 100, locale, 1),
        t('progress.summary.since', { date: fmtDate(baseline.at, locale, 'd MMM') }),
      ]
        .filter(Boolean)
        .join(' ')
    : t('progress.summary.firstReading')
  const pace =
    wide && rate
      ? t('progress.summary.pace', {
          rate: `${fmtSignedFixed(rate.perWeek, locale, RATE_DIGITS)} ${unit}/${t('progress.trend.weekShort')}`,
        })
      : null
  const minSpan = units.show(kind, SPARK_MIN_SPAN)
  const value = fmtReading(kind, change.latest.value, locale)
  const toGoal =
    wide && goal && baseline ? goalProgress(baseline.value, change.latest.value, goal) : null

  return (
    <Tile wide={wide} action={action} className={className}>
      <Kpi
        label={<span className="pr-8">{label}</span>}
        value={value}
        unit={unit}
        size={wide ? 'lg' : 'sm'}
        aside={aside}
        caption={pace ? `${since} · ${pace}` : since}
      />
      {data.spark.length > 1 && (
        <Spark
          values={data.spark}
          color={color}
          height={wide ? 36 : 24}
          minSpan={minSpan}
          className={wide ? 'mt-4' : 'mt-auto pt-3'}
        />
      )}
      {toGoal && goal && (
        <GoalMeter progress={toGoal} goal={goal} kind={kind} locale={locale} unit={unit} />
      )}
    </Tile>
  )
}

/** How much of the way to the goal is done, as a thin bar with the figure above it. */
function GoalMeter({
  progress,
  goal,
  kind,
  locale,
  unit,
}: {
  progress: NonNullable<ReturnType<typeof goalProgress>>
  goal: number
  kind: BodyTileKind
  locale: Locale
  unit: string
}) {
  const { t } = useTranslation()
  const done = progress.remaining === 0
  const text = done
    ? t('progress.bodyView.goalReached')
    : t('progress.summary.goalPath', {
        pct: fmtPercent(progress.fraction, locale),
        goal: `${fmtReading(kind, goal, locale)} ${unit}`,
      })
  const left = `${fmtReading(kind, progress.remaining, locale)} ${unit}`
  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[12.5px]">
        <span className="text-ink-2">{text}</span>
        {!done && (
          <span className="readout text-muted">{t('progress.summary.goalLeft', { n: left })}</span>
        )}
      </div>
      <Meter className="mt-2" value={Math.round(progress.fraction * 100)} max={100} label={text} />
    </div>
  )
}
