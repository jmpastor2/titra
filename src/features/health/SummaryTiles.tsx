/**
 * The tiles of the summary: a card with a quiet label and one big number (`Tile`, `Readout`),
 * and the body tile that shows a measurement's latest value, its change since the cycle began,
 * a sparkline and, for weight, the pace per week and the way to the goal.
 */
import { clsx } from 'clsx'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { fmtDate, fmtPercent, type Locale } from '@/lib/format'
import { KIND_DIGITS } from './kinds'
import { fmtSignedFixed } from './progress'
import { ChangeValue } from './ProgressCharts'
import { Sparkline } from './Spark'
import { goalProgress, type baselineChange, type weeklyRate } from './trend'
import { fmtReading, type BodyUnits } from './units'

/** The least a body sparkline zooms in to, in kg, cm or points of fat: two of them are a change. */
const SPARK_MIN_SPAN = 2
/** A weekly rate comes from a fit over a few weigh-ins: a tenth is as fine as it gets. */
const RATE_DIGITS = 1

export function Tile({
  label,
  wide = false,
  color,
  action,
  children,
}: {
  label: ReactNode
  wide?: boolean
  color?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={clsx('card fade-up flex min-w-0 flex-col p-3', wide && 'col-span-2')}
      style={color ? { borderColor: `color-mix(in oklab, ${color} 28%, var(--line))` } : undefined}
    >
      <div className="flex min-h-5 items-start justify-between gap-2">
        <span className="spec">{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

export function Readout({
  value,
  unit,
  tight = false,
  className,
}: {
  value: string
  unit?: string
  /** The unit continues the number ("4/14") instead of naming it ("77,0 kg"). */
  tight?: boolean
  className?: string
}) {
  return (
    <div className={clsx('readout mt-1.5 text-[22px] font-semibold leading-none', className)}>
      {value}
      {unit && (
        <span className={clsx('text-[11.5px] font-medium text-muted', !tight && 'ml-1')}>
          {unit}
        </span>
      )}
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
  rateHint,
  goal,
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
  rateHint?: string
  /** The goal in the person's unit, when there is one. */
  goal?: number | null
}) {
  const { t } = useTranslation()
  const { change, rate } = data
  const unit = units.unit(kind)
  const action = onLog && (
    // 44 px to hit, drawn as before: the tile's padding is taken back with the margin.
    <button
      type="button"
      onClick={onLog}
      aria-label={t('progress.summary.log', { what: label.toLowerCase() })}
      className="-m-3 grid size-11 place-items-center rounded-full text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <Plus className="size-4" />
    </button>
  )

  if (!change) {
    return (
      <Tile label={label} wide={wide} action={action}>
        <Readout value="—" />
        <p className="mt-1.5 text-[11.5px] text-muted">{empty}</p>
      </Tile>
    )
  }

  const delta = change.delta
  const detail =
    delta !== null && change.baseline ? (
      <>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <ChangeValue
            kind={kind}
            delta={delta}
            digits={KIND_DIGITS[kind]}
            unit={unit}
            threshold={0.2}
            className="text-[13px]"
          />
          {change.pct !== null && (
            <span className="readout text-[11.5px] text-muted">
              {fmtSignedFixed(change.pct * 100, locale, 1)}&nbsp;%
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
          {t('progress.summary.since', { date: fmtDate(change.baseline.at, locale, 'd MMM') })}
        </p>
      </>
    ) : (
      <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
        {t('progress.summary.firstReading')}
      </p>
    )

  const rateLine = wide && (
    <p className="mt-1 text-[11.5px] text-muted">
      {rate ? (
        <>
          {t('progress.trend.rateLabel')}{' '}
          <span className="readout whitespace-nowrap font-semibold text-ink-2">
            {fmtSignedFixed(rate.perWeek, locale, RATE_DIGITS)}&nbsp;{unit}/
            {t('progress.trend.weekShort')}
          </span>
        </>
      ) : (
        rateHint
      )}
    </p>
  )

  const minSpan = units.show(kind, SPARK_MIN_SPAN)
  const value = fmtReading(kind, change.latest.value, locale)
  const toGoal =
    wide && goal && change.baseline
      ? goalProgress(change.baseline.value, change.latest.value, goal)
      : null

  return (
    <Tile label={label} wide={wide} color={color} action={action}>
      {wide ? (
        <>
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <Readout value={value} unit={unit} className="text-[28px]" />
              {detail}
              {rateLine}
            </div>
            <Sparkline
              values={data.spark}
              color={color}
              height={52}
              minSpan={minSpan}
              className="w-[42%] shrink-0"
            />
          </div>
          {toGoal && goal && (
            <GoalBar progress={toGoal} goal={goal} kind={kind} locale={locale} unit={unit} />
          )}
        </>
      ) : (
        <>
          <Readout value={value} unit={unit} />
          {detail}
          {data.spark.length > 1 && (
            <Sparkline
              values={data.spark}
              color={color}
              height={22}
              minSpan={minSpan}
              className="mt-auto pt-2"
            />
          )}
        </>
      )}
    </Tile>
  )
}

/** How much of the way to the goal is done, as a thin bar with the figure beside it. */
function GoalBar({
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
  return (
    <div className="mt-3">
      <p className="text-[11.5px] text-muted">{text}</p>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress.fraction * 100)}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-3"
      >
        <div
          className="h-full rounded-full bg-signal"
          style={{ width: `${Math.round(progress.fraction * 100)}%` }}
        />
      </div>
    </div>
  )
}
