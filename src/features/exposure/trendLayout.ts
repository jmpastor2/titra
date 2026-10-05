/**
 * Where everything of a trend chart goes at a given width: the plot box, the scales, the ticks
 * and labels (none touching another) and the paths. Pure; see trendLayout.test.ts.
 */
import { format, type Locale as DateLocale } from 'date-fns'
import { fmtNumber, type Locale } from '@/lib/format'
import {
  estimateTextWidth,
  placeLabels,
  plotBox,
  scaleLinear,
  type PlacedLabel,
  type PlotBox,
  type Pt,
} from './chartLayout'
import { AXIS_FONT, LANE_H, type RailLabel } from './chartParts'
import { TREND_INSET, TREND_MARGIN } from './chartScale'
import type { TrendModel } from './trendModel'
import { monotonePath } from './trendPath'
import { spaceOut, trendTimeTicks, valueAxis } from './trendScale'

const DAY_MS = 86_400_000
/** Room under the plot for the time labels. */
const BOTTOM = 22
const RAIL_TOP = 6
/** A chart of this many readings or fewer (lab results) names the day of each one. */
const FEW_READINGS = 5
/** About the width of the target's name, to see which end of the line is free. */
const TARGET_REACH = 72
/** How far a reading must be from the line, in px, for the name not to be on top of it. */
const TARGET_CLEAR = 18

export interface TrendLayout {
  box: PlotBox
  x: (ms: number) => number
  y: (v: number) => number
  yDomain: readonly [number, number]
  yTicks: number[]
  /** Fraction digits that write every value tick. */
  decimals: number
  xTicks: number[]
  /** date-fns pattern of the time labels. */
  xPattern: string
  /** Guide labels placed in lanes above the plot, and the text of each. */
  placed: PlacedLabel[]
  rail: Map<string, RailLabel>
  /** Position of each row, in the order of the model's rows. */
  rowX: number[]
  paths: { raw: string; smooth: string }
  dots: { show: boolean; r: number }
  /** The target line and where its name goes, on the side with less data under it. */
  target: TargetMark | null
  /** Guides get fainter when they are packed, so they do not turn into a hatched block. */
  guideOpacity: number
}

export interface TargetMark {
  y: number
  label: { x: number; y: number; anchor: 'start' | 'end' }
}

export interface TrendLayoutInput {
  model: TrendModel
  width: number
  height: number
  /** Fraction digits of the readings. */
  digits: number
  locale: Locale
  dateLocale: DateLocale
}

/** Where a time label sits: it leans inward near an edge, as XAxisLabels draws it. */
function labelSpan(px: number, w: number, width: number): { left: number; right: number } {
  if (px < 20) return { left: px, right: px + w }
  if (px > width - 20) return { left: px - w, right: px }
  return { left: px - w / 2, right: px + w / 2 }
}

/** The gap, in px, between the cursor and the readout beside it. */
export const TIP_GAP = 14

/**
 * Which side of the cursor the readout goes on: the right, unless it would run out of the chart
 * there. Beside the cursor, never over it, so the finger does not hide what it picked.
 */
export function tipSide(cursorX: number, tipWidth: number, width: number): 'right' | 'left' {
  return cursorX + TIP_GAP + tipWidth <= width - 4 ? 'right' : 'left'
}

/** The key of the label of the i-th guide in the rail (two guides may share an instant). */
const guideKey = (index: number) => `guide-${index}`

export function layoutTrend({
  model,
  width,
  height,
  digits,
  locale,
  dateLocale,
}: TrendLayoutInput): TrendLayout {
  const [d0, d1] = model.domain

  // The value axis comes first: its labels decide the room on the left. The number of ticks
  // follows the height without the rail of labels, which is only known further down.
  const axis = valueAxis({
    lo: model.lo,
    hi: model.hi,
    plotHeight: height - TREND_MARGIN.top - BOTTOM,
    digits,
    fixed: model.fixedRange ?? undefined,
  })
  const labelW = Math.max(
    ...axis.ticks.map((v) => estimateTextWidth(fmtNumber(v, locale, axis.decimals), AXIS_FONT, 0)),
  )
  // The plot is inset like the protocol strips drawn above it, unless a label needs more room.
  const left = Math.max(TREND_INSET.left, Math.ceil(labelW) + 10)
  const right = TREND_INSET.right
  const draft = plotBox(width, height, { left, right, top: TREND_MARGIN.top, bottom: BOTTOM })
  const x = scaleLinear(d0, d1, draft.x0, draft.x1)

  // Labels of the guides (dose changes) go in a rail above the plot, in lanes of their own.
  const rail = new Map<string, RailLabel>()
  const specs = model.guides.flatMap((g, i) => {
    if (!g.label) return []
    const key = guideKey(i)
    rail.set(key, { key, text: g.label })
    // The latest change matters most when the labels do not all fit.
    return [{ key, x: x(g.at), width: estimateTextWidth(g.label, 10, 6), priority: i }]
  })
  const placed = placeLabels(specs, [draft.x0, draft.x1], 2)
  const lanes = placed.reduce((m, p) => Math.max(m, p.lane + 1), 0)
  const box = plotBox(width, height, {
    left,
    right,
    top: lanes > 0 ? RAIL_TOP + lanes * LANE_H + 4 : TREND_MARGIN.top,
    bottom: BOTTOM,
  })
  const y = scaleLinear(axis.domain[0], axis.domain[1], box.y1, box.y0)

  const { xTicks, xPattern } = timeAxis(model, x, box, width, dateLocale)

  const rowX = model.rows.map((r) => x(r.t))
  const line = (key: 'v' | 's'): Pt[] =>
    model.rows.flatMap((r, i) => {
      const v = r[key]
      return v === undefined ? [] : [[rowX[i] ?? x(r.t), y(v)] as const]
    })
  // A dot on every reading while they are far enough apart to be told apart.
  const spacing = box.width / Math.max(1, model.rawCount - 1)
  const single = model.rawCount === 1
  const dots = {
    show: single || spacing >= 5,
    r: single ? 4.5 : Math.min(model.hasSmooth ? 2.5 : 3, Math.max(1.8, spacing * 0.3)),
  }

  return {
    box,
    x,
    y,
    yDomain: axis.domain,
    yTicks: axis.ticks,
    decimals: axis.decimals,
    xTicks,
    xPattern,
    placed,
    rail,
    rowX,
    paths: {
      raw: monotonePath(line('v')),
      smooth: model.hasSmooth ? monotonePath(line('s')) : '',
    },
    dots,
    target: targetMark(model, y, rowX, box),
    guideOpacity: guideOpacity(model, x),
  }
}

function targetMark(
  model: TrendModel,
  y: (v: number) => number,
  rowX: readonly number[],
  box: PlotBox,
): TargetMark | null {
  if (model.target === null) return null
  const ty = y(model.target)
  // How close the nearest reading in a stretch comes to the line: the name goes where it is farthest.
  const nearest = (from: number, to: number) =>
    model.rows.reduce((best, r, i) => {
      const px = rowX[i] ?? Number.NaN
      const v = r.v ?? r.s
      return v !== undefined && px >= from && px <= to ? Math.min(best, Math.abs(y(v) - ty)) : best
    }, Number.POSITIVE_INFINITY)
  const right = nearest(box.x1 - TARGET_REACH, box.x1)
  // At the right unless a reading is in the way there and the left end is freer.
  const atRight = right >= TARGET_CLEAR || right >= nearest(box.x0, box.x0 + TARGET_REACH)
  return {
    y: ty,
    label: {
      x: atRight ? box.x1 - 4 : box.x0 + 4,
      // Above the line, or below it when the line is at the top of the plot.
      y: ty - box.y0 > 14 ? ty - 5 : ty + 13,
      anchor: atRight ? 'end' : 'start',
    },
  }
}

function guideOpacity(model: TrendModel, x: (ms: number) => number): number {
  const xs = model.guides.map((g) => x(g.at))
  const gap = xs.reduce((m, px, i) => (i > 0 ? Math.min(m, px - (xs[i - 1] ?? px)) : m), Infinity)
  return gap < 18 ? 0.4 : 0.6
}

/**
 * Time labels along the bottom, none touching another. A chart of a few readings names the day
 * of each, which is what matters for a lab result; the others have a calendar.
 */
function timeAxis(
  model: TrendModel,
  x: (ms: number) => number,
  box: PlotBox,
  width: number,
  dateLocale: DateLocale,
): { xTicks: number[]; xPattern: string } {
  const [d0, d1] = model.domain
  const place = (ticks: readonly number[], xPattern: string) => {
    const labels = ticks.map((t) => {
      const text = format(new Date(t), xPattern, { locale: dateLocale })
      return { t, ...labelSpan(x(t), estimateTextWidth(text, AXIS_FONT, 0), width) }
    })
    return { xTicks: spaceOut(labels, 8).map((l) => l.t), xPattern }
  }

  if (!model.fixedWindow && model.rawCount > 0 && model.rawCount <= FEW_READINGS) {
    const days = model.rows.flatMap((r) => (r.v === undefined ? [] : [r.t]))
    const pattern = (days.at(-1) ?? 0) - (days[0] ?? 0) > 300 * DAY_MS ? 'd MMM yy' : 'd MMM'
    const names = days.map((t) => format(new Date(t), pattern, { locale: dateLocale }))
    // Two readings on one day would carry the same name: the calendar tells them apart.
    if (new Set(names).size === names.length) return place(days, pattern)
  }
  const found = trendTimeTicks(d0, d1, Math.max(2, Math.min(6, Math.floor(box.width / 56))))
  return place(
    found.ticks,
    found.pattern === 'MMM' && (d1 - d0) / DAY_MS > 300 ? 'MMM yy' : found.pattern,
  )
}
