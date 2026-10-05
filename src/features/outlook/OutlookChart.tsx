/**
 * The chart of the "Futuro" screen: the band a published trial observed for the arms around
 * the dose, placebo, the person's own weigh-ins and a line drawn forward from them, against
 * weeks on treatment. Plain SVG on the primitives of the level charts; the maths is in
 * outlookChart.ts. The dots are the published data: the lines only join them.
 */
import { memo, useCallback, useId, useMemo } from 'react'
import { LegendItem, LegendList } from '@/features/exposure/CardParts'
import { nearestIndex } from '@/features/exposure/chartLayout'
import { AXIS_FONT, RailLabels } from '@/features/exposure/chartParts'
import { TrendTip } from '@/features/exposure/trendLayers'
import { useChartPointer } from '@/features/exposure/useChartPointer'
import { useChartWidth } from '@/features/exposure/useChartWidth'
import { fmtSigned } from '@/features/health/progress'
import { fmtNumber } from '@/lib/format'
import type { BandPoint, Horizon } from './outlook'
import {
  buildOutlookModel,
  describeStop,
  firstStopFrom,
  layoutOutlook,
  type AxisPoint,
  type OutlookLayout,
  type OutlookModel,
  type OutlookStop,
} from './outlookPlot'
import { bandText, type Fmt } from './outlookFormat'

export type { AxisPoint }

const HEIGHT = 200

export function OutlookChart({
  f,
  color,
  series,
  todayWeeks,
  targetWeeks,
  horizon,
  me,
  projection,
}: {
  f: Fmt
  color: string
  series: readonly BandPoint[]
  todayWeeks: number
  targetWeeks: number
  horizon: Horizon
  me: readonly AxisPoint[]
  projection: readonly AxisPoint[]
}) {
  const { t, locale } = f
  const clipId = `outlook-clip-${useId().replace(/\W/g, '')}`
  const [ref, width] = useChartWidth()
  const model = useMemo(
    () => buildOutlookModel({ series, me, projection, todayWeeks, targetWeeks }),
    [series, me, projection, todayWeeks, targetWeeks],
  )
  const layout = useMemo(
    () =>
      layoutOutlook(model, {
        width,
        height: HEIGHT,
        texts: {
          today: t('outlook.chart.today'),
          horizon: t('outlook.horizon.months', { n: horizon }),
          signed: (v) => fmtSigned(v, locale, 0),
          week: (n) => t('outlook.chart.weekTick', { n }),
        },
      }),
    [model, width, horizon, t, locale],
  )

  const indexAt = useCallback((px: number) => nearestIndex(layout.stopX, px), [layout.stopX])
  const { svgRef, selected, handlers } = useChartPointer({
    count: model.stops.length,
    box: layout.box,
    indexAt,
    // The arrow keys begin at today: the first thing that is not behind it.
    start: firstStopFrom(model, todayWeeks),
  })
  const stop = selected === null ? undefined : model.stops[selected]
  const lines = stop ? describeStop(f, stop) : []

  if (model.band.length === 0) return null
  const last = model.band.at(-1)
  const latest = model.me.at(-1)
  const end = model.projection.at(1)
  const summary = [
    t('outlook.chart.summary', {
      today: fmtNumber(todayWeeks, locale, 0),
      week: last?.week ?? 0,
      band: bandText(f, last?.lowerPct ?? 0, last?.upperPct ?? 0, 1),
    }),
    latest && t('outlook.chart.summaryYou', { pct: f.pct(latest.pct) }),
    end &&
      t('outlook.chart.summaryProjection', {
        pct: f.pct(end.pct),
        week: fmtNumber(end.week, locale, 0),
      }),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <figure>
      <div ref={ref} className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={summary}
          tabIndex={0}
          className="block touch-pan-y select-none outline-none focus-visible:ring-1 focus-visible:ring-signal/50"
          {...handlers}
        >
          <OutlookLayers
            model={model}
            layout={layout}
            width={width}
            color={color}
            clipId={clipId}
          />
          {stop && <OutlookCursor stop={stop} layout={layout} />}
        </svg>
        {stop && (
          <TrendTip lines={lines} compact={false} cursorX={layout.x(stop.week)} width={width} />
        )}
        {/* Said aloud when the arrow keys move the cursor; the card is only for the eyes. */}
        <span className="sr-only" aria-live="polite">
          {lines.join(', ')}
        </span>
      </div>
      <figcaption className="flex flex-col text-[11px] text-muted">
        <LegendList>
          <LegendItem
            swatch={
              <span
                className="h-2.5 w-4 rounded-sm"
                style={{ background: `color-mix(in oklab, ${color} 35%, transparent)` }}
              />
            }
          >
            {t('outlook.chart.band')}
          </LegendItem>
          <LegendItem swatch={<span className="w-4 border-t border-dashed border-muted" />}>
            {t('outlook.chart.placebo')}
          </LegendItem>
          {model.me.length > 0 && (
            <LegendItem swatch={<span className="size-2 rounded-full bg-ink" />}>
              {t('outlook.chart.you')}
            </LegendItem>
          )}
          {model.projection.length === 2 && (
            <LegendItem swatch={<span className="w-4 border-t-2 border-dotted border-ink-2" />}>
              {t('outlook.chart.projection')}
            </LegendItem>
          )}
        </LegendList>
        <span className="px-1">{t('outlook.chart.observedOnly')}</span>
      </figcaption>
    </figure>
  )
}

const OutlookLayers = memo(function OutlookLayers({
  model,
  layout,
  width,
  color,
  clipId,
}: {
  model: OutlookModel
  layout: OutlookLayout
  width: number
  color: string
  clipId: string
}) {
  const { box, x, y, paths } = layout
  const todayX = x(model.today)
  const horizonX = model.horizon === null ? null : x(model.horizon)
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={box.x0} y={box.y0 - 2} width={box.width} height={box.height + 4} />
        </clipPath>
      </defs>

      <g aria-hidden>
        {layout.yTicks.map(({ value, text }) => (
          <g key={value}>
            <line
              x1={box.x0}
              x2={box.x1}
              y1={y(value)}
              y2={y(value)}
              stroke={value === 0 ? 'var(--line-strong)' : 'var(--line)'}
              strokeDasharray={value === 0 ? undefined : '2 4'}
            />
            <text
              x={box.x0 - 6}
              y={y(value) + 4}
              textAnchor="end"
              fontSize={AXIS_FONT}
              fill="var(--muted)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {text}
            </text>
          </g>
        ))}
        {/* The unit of the value axis, where the rail of labels begins. */}
        <text
          x={box.x0 - 6}
          y={11}
          textAnchor="end"
          fontSize={9.5}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          fill="var(--muted)"
        >
          %
        </text>
      </g>

      <g clipPath={`url(#${clipId})`} aria-hidden>
        <path d={paths.band} fill={color} fillOpacity={0.18} />
        <path d={paths.lower} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={paths.upper} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
        <path
          d={paths.placebo}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        {model.projection.length === 2 && (
          <path
            d={paths.projection}
            fill="none"
            stroke="var(--ink-2)"
            strokeWidth={1.5}
            strokeDasharray="1 3"
            strokeLinecap="round"
          />
        )}
        {horizonX !== null && (
          <line
            data-part="horizon"
            x1={horizonX}
            x2={horizonX}
            y1={box.y0}
            y2={box.y1}
            stroke="var(--ink-2)"
            strokeDasharray="3 3"
          />
        )}
        <line
          data-part="today"
          x1={todayX}
          x2={todayX}
          y1={box.y0}
          y2={box.y1}
          stroke="var(--signal)"
          strokeWidth={1.5}
        />
      </g>

      {/* The published values: the lines only join them. */}
      <g aria-hidden data-part="published">
        {model.band.flatMap((p) =>
          p.observed
            ? (
                [
                  ['low', p.lowerPct],
                  ['high', p.upperPct],
                ] as const
              ).map(([side, pct]) => (
                <circle
                  key={`${p.week}-${side}`}
                  cx={x(p.week)}
                  cy={y(pct)}
                  r={4.5}
                  fill={color}
                  stroke="var(--panel)"
                  strokeWidth={2}
                />
              ))
            : [],
        )}
      </g>
      <g aria-hidden data-part="me">
        {model.me.map((p) => (
          <circle
            key={`${p.week}-${p.pct}`}
            cx={x(p.week)}
            cy={y(p.pct)}
            r={layout.meRadius}
            fill="var(--ink)"
            stroke="var(--panel)"
            strokeWidth={1.5}
          />
        ))}
      </g>

      <g aria-hidden>
        {layout.xTicks.map(({ week, text }) => {
          const px = x(week)
          return (
            <g key={week}>
              <line x1={px} x2={px} y1={box.y1} y2={box.y1 + 3} stroke="var(--line-strong)" />
              <text
                x={px}
                y={box.y1 + 16}
                textAnchor={px < 20 ? 'start' : px > width - 20 ? 'end' : 'middle'}
                fontSize={AXIS_FONT}
                fill="var(--muted)"
              >
                {text}
              </text>
            </g>
          )
        })}
      </g>
      <RailLabels placed={layout.placed} labels={layout.rail} />
    </>
  )
})

/** The line and the rings under the finger (or the arrow keys). */
function OutlookCursor({ stop, layout }: { stop: OutlookStop; layout: OutlookLayout }) {
  const { box, x, y } = layout
  const px = x(stop.week)
  const values = stop.kind === 'trial' ? [...new Set([stop.lowerPct, stop.upperPct])] : [stop.pct]
  return (
    <g pointerEvents="none" data-part="cursor">
      <line x1={px} x2={px} y1={box.y0} y2={box.y1} stroke="var(--ink-2)" strokeWidth={1} />
      {values.map((v) => (
        <circle
          key={v}
          cx={px}
          cy={y(v)}
          r={8}
          fill="none"
          stroke="var(--ink-2)"
          strokeWidth={1.5}
        />
      ))}
    </g>
  )
}
