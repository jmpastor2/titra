/**
 * The chart of the "Futuro" screen as numbers: the band a trial observed for the arms around
 * the dose, the person's own weigh-ins and the line drawn forward from them, on the axis of
 * weeks on treatment. Pure; see outlookChart.test.ts.
 */
import {
  estimateTextWidth,
  linePath,
  placeLabels,
  plotBox,
  scaleLinear,
  type PlacedLabel,
  type PlotBox,
  type Pt,
} from '@/features/exposure/chartLayout'
import { LANE_H, type RailLabel } from '@/features/exposure/chartParts'
import { bandPath } from '@/features/exposure/trendPath'
import { fmtNumber } from '@/lib/format'
import { chartWeeks, type BandPoint } from './outlook'
import { bandText, type Fmt } from './outlookFormat'

/** A reading on the chart: weeks on treatment and % change in body weight from the start. */
export interface AxisPoint {
  week: number
  pct: number
  /** When it was weighed and how much, for the readout. */
  at?: Date
  kg?: number
}

export interface OutlookChartData {
  /** The trial band over time: the origin at week 0 and each published time point. */
  series: readonly BandPoint[]
  /** The person's weigh-ins on the treatment-week axis. */
  me: readonly AxisPoint[]
  /** The two ends of the line drawn forward from the last weigh-in, or none. */
  projection: readonly AxisPoint[]
  todayWeeks: number
  targetWeeks: number
}

/** Something the pointer can land on: a published time point, a weigh-in or the end of the line. */
export type OutlookStop =
  | { kind: 'trial'; week: number; lowerPct: number; upperPct: number; placeboPct: number }
  | { kind: 'me'; week: number; pct: number; at?: Date; kg?: number }
  | { kind: 'projection'; week: number; pct: number; at?: Date; kg?: number }

export interface OutlookModel {
  band: readonly BandPoint[]
  me: AxisPoint[]
  projection: AxisPoint[]
  maxWeek: number
  yLo: number
  yHi: number
  yTicks: number[]
  /** Where the lines of today and of the horizon stand, in weeks (the horizon only when ahead). */
  today: number
  horizon: number | null
  /** In order of weeks. */
  stops: OutlookStop[]
}

const finite = (v: number) => Number.isFinite(v)

/**
 * Whole 5-point ticks (10 when the range is wide), with some air above zero so the origin and
 * the lines of today and the horizon do not sit on the frame. Nothing is drawn above 100 %.
 */
export function percentAxis(values: readonly number[]): {
  lo: number
  hi: number
  ticks: number[]
} {
  const all = [...values.filter(finite), 0]
  const lo = Math.floor((Math.min(...all) - 1) / 5) * 5
  const top = Math.max(...all)
  const hi = top > 0 ? Math.ceil((top + 1) / 5) * 5 : 3
  const step = hi - lo > 30 ? 10 : 5
  const ticks = Array.from(
    { length: Math.floor((Math.min(hi, 100) - lo) / step) + 1 },
    (_, i) => lo + i * step,
  )
  return { lo, hi, ticks }
}

/** Weeks on the axis: every 12, or every 24, 48… when the labels would not fit side by side. */
export function weekTicks(maxWeek: number, plotWidth: number, labelWidth = 30): number[] {
  let step = 12
  while (step < maxWeek && (plotWidth * step) / maxWeek < labelWidth + 8) step *= 2
  return Array.from({ length: Math.floor(maxWeek / step) + 1 }, (_, i) => i * step)
}

export function buildOutlookModel(data: OutlookChartData): OutlookModel {
  const band = data.series.filter((p) => finite(p.week) && finite(p.lowerPct) && finite(p.upperPct))
  const me = data.me.filter((p) => finite(p.week) && finite(p.pct))
  const projection =
    data.projection.length === 2 && data.projection.every((p) => finite(p.week) && finite(p.pct))
      ? [...data.projection]
      : []
  const maxWeek = chartWeeks(
    band.at(-1)?.week ?? 48,
    data.targetWeeks,
    data.todayWeeks,
    ...me.map((p) => p.week),
  )
  const axis = percentAxis([
    ...band.flatMap((p) => [p.lowerPct, p.upperPct]),
    ...me.map((p) => p.pct),
    ...projection.map((p) => p.pct),
  ])
  const end = projection.at(1)
  const stops: OutlookStop[] = [
    ...band.flatMap((p): OutlookStop[] =>
      p.observed
        ? [
            {
              kind: 'trial',
              week: p.week,
              lowerPct: p.lowerPct,
              upperPct: p.upperPct,
              placeboPct: p.placeboPct,
            },
          ]
        : [],
    ),
    ...me.map((p): OutlookStop => ({ kind: 'me', ...p })),
    ...(end ? [{ kind: 'projection', ...end } satisfies OutlookStop] : []),
  ].toSorted((a, b) => a.week - b.week)
  return {
    band,
    me,
    projection,
    maxWeek,
    yLo: axis.lo,
    yHi: axis.hi,
    yTicks: axis.ticks,
    today: Math.min(Math.max(0, data.todayWeeks), maxWeek),
    horizon: data.targetWeeks > data.todayWeeks ? Math.min(data.targetWeeks, maxWeek) : null,
    stops,
  }
}

const RIGHT = 12
const BOTTOM = 22
const RAIL_TOP = 6

export interface OutlookLayout {
  box: PlotBox
  x: (week: number) => number
  y: (pct: number) => number
  yTicks: { value: number; text: string }[]
  xTicks: { week: number; text: string }[]
  /** Labels of today and the horizon, in lanes above the plot, and their text. */
  placed: PlacedLabel[]
  rail: Map<string, RailLabel>
  paths: { band: string; upper: string; lower: string; placebo: string; projection: string }
  /** Position of each stop, in order. */
  stopX: number[]
  /** Radius of the dots of the person's weigh-ins: smaller when they crowd together. */
  meRadius: number
}

export interface OutlookTexts {
  today: string
  /** "6 meses". */
  horizon: string
  /** A signed whole number for the value axis: "−5", "+5", "0". */
  signed: (v: number) => string
  /** "s12". */
  week: (n: number) => string
}

export function layoutOutlook(
  model: OutlookModel,
  { width, height, texts }: { width: number; height: number; texts: OutlookTexts },
): OutlookLayout {
  const yTicks = model.yTicks.map((value) => ({ value, text: texts.signed(value) }))
  const left = 10 + 6.4 * Math.max(...yTicks.map((t) => t.text.length))
  const draft = plotBox(width, height, { left, right: RIGHT, top: RAIL_TOP, bottom: BOTTOM })
  const x = scaleLinear(0, model.maxWeek, draft.x0, draft.x1)

  const rail = new Map<string, RailLabel>([
    ['today', { key: 'today', text: texts.today, strong: true }],
  ])
  const specs = [
    { key: 'today', x: x(model.today), width: estimateTextWidth(texts.today, 9.5, 6), priority: 9 },
  ]
  if (model.horizon !== null) {
    rail.set('horizon', { key: 'horizon', text: texts.horizon })
    specs.push({
      key: 'horizon',
      x: x(model.horizon),
      width: estimateTextWidth(texts.horizon, 10, 6),
      priority: 5,
    })
  }
  const placed = placeLabels(specs, [draft.x0, draft.x1], 2)
  const lanes = placed.reduce((m, p) => Math.max(m, p.lane + 1), 0)
  const box = plotBox(width, height, {
    left,
    right: RIGHT,
    top: RAIL_TOP + lanes * LANE_H + 4,
    bottom: BOTTOM,
  })
  const y = scaleLinear(model.yLo, model.yHi, box.y1, box.y0)

  // Week labels: every 12 weeks, fewer when they would touch.
  const xTicks = weekTicks(model.maxWeek, box.width).map((week) => ({
    week,
    text: texts.week(week),
  }))

  const point = (week: number, pct: number): Pt => [x(week), y(pct)]
  const line = (pick: (p: OutlookModel['band'][number]) => number): Pt[] =>
    model.band.map((p) => point(p.week, pick(p)))
  const upper = line((p) => p.upperPct)
  const lower = line((p) => p.lowerPct)
  return {
    box,
    x,
    y,
    yTicks,
    xTicks,
    placed,
    rail,
    paths: {
      band: bandPath(upper, lower),
      upper: linePath(upper),
      lower: linePath(lower),
      placebo: linePath(line((p) => p.placeboPct)),
      projection: linePath(model.projection.map((p) => point(p.week, p.pct))),
    },
    stopX: model.stops.map((s) => x(s.week)),
    meRadius: weighInRadius(model.me.map((p) => x(p.week))),
  }
}

/** Dots that touch their neighbours are drawn smaller, down to a dot that can still be seen. */
function weighInRadius(xs: readonly number[]): number {
  const gap = xs.reduce((m, px, i) => (i > 0 ? Math.min(m, px - (xs[i - 1] ?? px)) : m), Infinity)
  return Math.min(4.5, Math.max(2.5, gap * 0.5))
}

/** Where the arrow keys begin: the first stop that is not behind today, else the last one. */
export function firstStopFrom(model: OutlookModel, weeks: number): number {
  const i = model.stops.findIndex((s) => s.week >= weeks)
  return i < 0 ? Math.max(0, model.stops.length - 1) : i
}

/** What one stop says, line by line: what it is, its value and a note. */
export function describeStop(f: Fmt, stop: OutlookStop): string[] {
  const { t, locale } = f
  const week = fmtNumber(stop.week, locale, 0)
  switch (stop.kind) {
    case 'trial':
      return [
        t('outlook.chart.readout.trial', { week }),
        bandText(f, stop.lowerPct, stop.upperPct, 1),
        t('outlook.chart.readout.placebo', { pct: f.pct(stop.placeboPct) }),
      ]
    case 'me':
      return [
        t('outlook.chart.readout.you', { week }),
        f.pct(stop.pct),
        [stop.kg === undefined ? null : f.weight(stop.kg), stop.at ? f.date(stop.at) : null]
          .filter((part) => part !== null)
          .join(' · '),
      ].filter((line) => line !== '')
    case 'projection':
      return [
        t('outlook.chart.readout.projection', { week }),
        f.pct(stop.pct),
        [t('outlook.personal.badge'), stop.kg === undefined ? null : `≈ ${f.weight(stop.kg)}`]
          .filter((part) => part !== null)
          .join(' · '),
      ]
  }
}
