/**
 * The layers of a trend chart. The still ones (grid, bands, guides, lines, labels) are one
 * memoised component that does not depend on what the finger touches; the cursor is a layer of
 * its own, so moving the finger redraws a line and a dot and nothing else.
 */
import { clsx } from 'clsx'
import type { Locale as DateLocale } from 'date-fns'
import { memo } from 'react'
import type { Locale } from '@/lib/format'
import { estimateTextWidth } from './chartLayout'
import { RailLabels, XAxisLabels, YAxisGrid } from './chartParts'
import { TIP_GAP, tipSide, type TrendLayout } from './trendLayout'
import type { TrendModel, TrendRow } from './trendModel'

const GLOW = (color: string) =>
  `drop-shadow(0 0 4px color-mix(in oklab, ${color} 60%, transparent))`

export const TrendLayers = memo(function TrendLayers({
  model,
  layout,
  width,
  color,
  clipId,
  locale,
  dateLocale,
  targetLabel,
}: {
  model: TrendModel
  layout: TrendLayout
  width: number
  color: string
  clipId: string
  locale: Locale
  dateLocale: DateLocale
  targetLabel: string
}) {
  const { box, x, y, dots, paths, target } = layout
  const { hasSmooth, ref } = model
  // What the plot holds is cut at its edges; the dots and labels are not.
  const edge = (v: number) => Math.min(box.y1, Math.max(box.y0, y(v)))

  // The reference range is a soft band; a range with one limit shades the side that is in range.
  const bandTop = ref ? (ref.high !== null ? edge(ref.high) : box.y0) : 0
  const bandBottom = ref ? (ref.low !== null ? edge(ref.low) : box.y1) : 0

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={box.x0} y={box.y0 - 2} width={box.width} height={box.height + 4} />
        </clipPath>
      </defs>

      <YAxisGrid ticks={layout.yTicks} box={box} y={y} decimals={layout.decimals} locale={locale} />

      <g clipPath={`url(#${clipId})`} aria-hidden>
        {model.shades.map((s) => (
          <rect
            key={`shade-${s.from}-${s.to}-${s.color}`}
            x={x(s.from)}
            y={box.y0}
            width={Math.max(0, x(s.to) - x(s.from))}
            height={box.height}
            fill={s.color}
            fillOpacity={0.08}
          />
        ))}
        {ref && (
          <g data-part="reference">
            <rect
              x={box.x0}
              y={bandTop}
              width={box.width}
              height={Math.max(0, bandBottom - bandTop)}
              fill="var(--chart-5)"
              fillOpacity={0.1}
            />
            {(
              [
                ['low', ref.low],
                ['high', ref.high],
              ] as const
            ).map(([side, v]) =>
              v === null ? null : (
                <line
                  key={side}
                  x1={box.x0}
                  x2={box.x1}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--chart-5)"
                  strokeOpacity={0.6}
                  strokeDasharray="3 3"
                />
              ),
            )}
          </g>
        )}
        {model.guides.map((g) => (
          <line
            key={`guide-${g.at}-${g.color}-${g.label ?? ''}`}
            x1={x(g.at)}
            x2={x(g.at)}
            y1={box.y0}
            y2={box.y1}
            stroke={g.color}
            strokeOpacity={layout.guideOpacity}
            strokeDasharray="2 3"
          />
        ))}
        {target && (
          <line
            data-part="target"
            x1={box.x0}
            x2={box.x1}
            y1={target.y}
            y2={target.y}
            stroke="var(--chart-2)"
            strokeDasharray="4 4"
          />
        )}
        <path
          d={paths.raw}
          fill="none"
          stroke={color}
          strokeWidth={hasSmooth ? 1 : 2}
          strokeOpacity={hasSmooth ? 0.35 : 1}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={hasSmooth ? undefined : { filter: GLOW(color) }}
        />
        {hasSmooth && (
          <path
            data-part="trend"
            d={paths.smooth}
            fill="none"
            stroke={color}
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: GLOW(color) }}
          />
        )}
      </g>

      {dots.show && (
        <g aria-hidden>
          {model.rows.map((r) =>
            r.v === undefined ? null : (
              <circle
                key={r.t}
                cx={x(r.t)}
                cy={y(r.v)}
                r={dots.r}
                fill={color}
                fillOpacity={hasSmooth ? 0.7 : 1}
                stroke="var(--panel)"
                strokeWidth={hasSmooth ? 1.5 : 2}
              />
            ),
          )}
        </g>
      )}

      {target && (
        <text
          aria-hidden
          x={target.label.x}
          y={target.label.y}
          textAnchor={target.label.anchor}
          fontSize={10}
          fontWeight={600}
          fill="var(--ink-2)"
          stroke="var(--panel)"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {targetLabel}
        </text>
      )}

      <XAxisLabels
        ticks={layout.xTicks}
        pattern={layout.xPattern}
        x={x}
        baselineY={box.y1}
        width={width}
        dateLocale={dateLocale}
      />
      <RailLabels placed={layout.placed} labels={layout.rail} />
    </>
  )
})

/** The line and the dot under the finger (or the arrow keys). */
export function TrendCursor({
  row,
  layout,
  color,
}: {
  row: TrendRow
  layout: TrendLayout
  color: string
}) {
  const { box, y } = layout
  const px = layout.x(row.t)
  const main = row.v ?? row.s
  return (
    <g pointerEvents="none" data-part="cursor">
      <line x1={px} x2={px} y1={box.y0} y2={box.y1} stroke="var(--ink-2)" strokeWidth={1} />
      {row.v !== undefined && row.s !== undefined && (
        <circle cx={px} cy={y(row.s)} r={4} fill="var(--panel)" stroke={color} strokeWidth={2} />
      )}
      {main !== undefined && (
        <circle cx={px} cy={y(main)} r={5} fill={color} stroke="var(--panel)" strokeWidth={2} />
      )}
    </g>
  )
}

/** The date reads quietly; the reading is the point; a trend line after it reads quietly again. */
const lineTone = (i: number) => (i === 1 ? 'readout font-semibold text-ink' : 'text-muted')

/**
 * What the cursor is on, in a small card beside it near the top of the chart: the date, the
 * reading and, with a trend line, the trend. It has no layout of its own, so the chart never
 * moves. `compact` sets the lines side by side, for a chart too short to spare three of them.
 */
export function TrendTip({
  lines,
  compact,
  cursorX,
  width,
}: {
  lines: readonly string[]
  compact: boolean
  cursorX: number
  width: number
}) {
  const sizes = lines.map((l) => estimateTextWidth(l, 11.5, 0))
  const w = 24 + (compact ? sizes.reduce((sum, n) => sum + n + 6, 0) : Math.max(...sizes))
  const place =
    tipSide(cursorX, w, width) === 'right'
      ? { left: cursorX + TIP_GAP }
      : { right: width - cursorX + TIP_GAP }
  return (
    <div
      aria-hidden
      data-part="tip"
      className={clsx(
        'pointer-events-none absolute top-0.5 z-10 flex whitespace-nowrap rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11.5px] leading-snug shadow-lg',
        compact ? 'items-baseline gap-1.5' : 'flex-col',
      )}
      style={place}
    >
      {lines.map((line, i) => (
        <span key={line} className={lineTone(i)}>
          {line}
        </span>
      ))}
    </div>
  )
}
