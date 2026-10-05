/**
 * A value over time: raw readings and, optionally, a smoothed trend; a target, a reference
 * range, dose-change guides and shaded pauses. Plain SVG on the same primitives as the level
 * charts (axes, label rail, pointer); the maths lives in trend*.ts. What the finger picks shows
 * in a small card beside the cursor, as before, so the chart keeps its height.
 */
import { enUS, es } from 'date-fns/locale'
import { useCallback, useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/lib/useLocale'
import { nearestIndex } from './chartLayout'
import { layoutTrend } from './trendLayout'
import { TrendCursor, TrendLayers, TrendTip } from './trendLayers'
import {
  buildTrendModel,
  describeReading,
  describeTrend,
  readoutPattern,
  type TrendGuide,
  type TrendModel,
  type TrendPoint,
  type TrendRow,
  type TrendShade,
} from './trendModel'
import { useChartPointer } from './useChartPointer'
import { useChartWidth } from './useChartWidth'

export type { TrendGuide, TrendPoint, TrendShade }

/** Below this height (the small multiples) the readout card is a single line. */
const COMPACT_HEIGHT = 120

const NO_GUIDES: TrendGuide[] = []
const NO_SHADES: TrendShade[] = []

export interface TrendChartProps {
  points: TrendPoint[]
  unit: string
  /** Height of the chart, time axis included. */
  height?: number
  target?: number
  refRange?: { low?: number | null; high?: number | null }
  color?: string
  /** Fraction digits of the readings. */
  digits?: number
  /** Fixed y domain, e.g. [0, 10] for scores, so small multiples share a scale. */
  range?: [number, number]
  /** Fixed time window (epoch ms) so charts share an x scale with the protocol strip. */
  xDomain?: [number, number]
  guides?: TrendGuide[]
  shades?: TrendShade[]
  /**
   * A smoothed trend drawn as the main line; the raw readings then show as dots on a
   * faint line, so the day-to-day noise stays visible but does not steal the story.
   */
  smooth?: TrendPoint[]
  /** Label of the smoothed value in the readout, e.g. "Tendencia". */
  smoothLabel?: string
  /** What the chart is about, for screen readers: "Peso". */
  label?: string
}

export function TrendChart({
  points,
  unit,
  height = 180,
  target,
  refRange,
  color = 'var(--chart-1)',
  digits = 1,
  range,
  xDomain,
  guides = NO_GUIDES,
  shades = NO_SHADES,
  smooth,
  smoothLabel = '~',
  label,
}: TrendChartProps) {
  const { t } = useTranslation()
  // Callers often pass fresh arrays and objects for these: depend on what is inside.
  const [x0, x1] = xDomain ?? []
  const [r0, r1] = range ?? []
  const low = refRange?.low
  const high = refRange?.high
  const model = useMemo(
    () =>
      buildTrendModel({
        points,
        smooth,
        xDomain: x0 === undefined || x1 === undefined ? undefined : [x0, x1],
        target,
        refRange: { low, high },
        range: r0 === undefined || r1 === undefined ? undefined : [r0, r1],
        guides,
        shades,
      }),
    [points, smooth, x0, x1, target, low, high, r0, r1, guides, shades],
  )

  if (!model) {
    return (
      <div className="grid place-items-center text-[12.5px] text-muted" style={{ height }}>
        {t('trend.empty')}
      </div>
    )
  }
  return (
    <TrendPlot
      model={model}
      unit={unit}
      height={height}
      color={color}
      digits={digits}
      smoothLabel={smoothLabel}
      label={label}
    />
  )
}

function TrendPlot({
  model,
  unit,
  height,
  color,
  digits,
  smoothLabel,
  label,
}: {
  model: TrendModel
  unit: string
  height: number
  color: string
  digits: number
  smoothLabel: string
  label: string | undefined
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dateLocale = locale === 'es' ? es : enUS
  const clipId = `trend-clip-${useId().replace(/\W/g, '')}`
  const [ref, width] = useChartWidth()

  // Everything that depends on the data and the width, once; the finger changes none of it.
  const layout = useMemo(
    () => layoutTrend({ model, width, height, digits, locale, dateLocale }),
    [model, width, height, digits, locale, dateLocale],
  )
  const aria = useMemo(
    () => describeTrend({ model, t, locale, unit, digits, label }),
    [model, t, locale, unit, digits, label],
  )
  const pattern = useMemo(() => readoutPattern(model), [model])

  const { rows } = model
  const indexAt = useCallback((px: number) => nearestIndex(layout.rowX, px), [layout.rowX])
  const { svgRef, selected, handlers } = useChartPointer({
    count: rows.length,
    box: layout.box,
    indexAt,
    // The arrow keys begin at the latest reading.
    start: rows.length - 1,
  })
  const picked: TrendRow | undefined = selected === null ? undefined : rows[selected]
  const lines = picked
    ? describeReading(picked, { pattern, dateLocale, locale, unit, digits, smoothLabel })
    : []

  return (
    <div ref={ref} className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={aria}
        tabIndex={0}
        className="block touch-pan-y select-none outline-none focus-visible:ring-1 focus-visible:ring-signal/50"
        {...handlers}
      >
        <TrendLayers
          model={model}
          layout={layout}
          width={width}
          color={color}
          clipId={clipId}
          locale={locale}
          dateLocale={dateLocale}
          targetLabel={t('trend.target')}
        />
        {picked && <TrendCursor row={picked} layout={layout} color={color} />}
      </svg>
      {picked && (
        <TrendTip
          lines={lines}
          compact={height < COMPACT_HEIGHT}
          cursorX={layout.x(picked.t)}
          width={width}
        />
      )}
      {/* Said aloud when the arrow keys move the cursor; the card is only for the eyes. */}
      <span className="sr-only" aria-live="polite">
        {lines.join(', ')}
      </span>
    </div>
  )
}
