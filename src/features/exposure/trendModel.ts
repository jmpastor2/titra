/**
 * The data side of the trend chart: which readings are drawn, over which window and value
 * span, and what the chart says in words. Pure; see trendModel.test.ts.
 */
import { format, type Locale as DateLocale } from 'date-fns'
import type { TFunction } from 'i18next'
import { fmtDate, fmtNumber, type Locale } from '@/lib/format'

export interface TrendPoint {
  at: Date
  value: number
}

/** A vertical guide, e.g. where a protocol changes dose, optionally labelled ("1,5 mg"). */
export interface TrendGuide {
  at: number
  color: string
  label?: string
}

/** A shaded time span, e.g. a protocol pause. */
export interface TrendShade {
  from: number
  to: number
  color: string
}

/** One row per instant: the raw reading (v) and/or the smoothed trend (s). */
export interface TrendRow {
  t: number
  v?: number
  s?: number
}

export interface TrendInput {
  points: readonly TrendPoint[]
  smooth?: readonly TrendPoint[]
  /** Fixed time window (epoch ms), so the chart shares an x scale with the protocol strip. */
  xDomain?: readonly [number, number]
  target?: number
  refRange?: { low?: number | null; high?: number | null }
  /** Fixed value domain, e.g. [0, 10] for scores. */
  range?: readonly [number, number]
  guides?: readonly TrendGuide[]
  shades?: readonly TrendShade[]
}

export interface TrendModel {
  /** Time order, one row per instant. */
  rows: TrendRow[]
  hasSmooth: boolean
  /** Raw readings drawn (the smoothed ones do not count). */
  rawCount: number
  /** Time window in epoch ms. */
  domain: [number, number]
  /** Whether the window was given (aligned with something else) or follows the readings. */
  fixedWindow: boolean
  /** Lowest and highest value among the readings, the target and the reference range. */
  lo: number
  hi: number
  /** The value domain when the caller pinned it. */
  fixedRange: [number, number] | null
  target: number | null
  /** The reference range, when it has at least one finite bound. */
  ref: { low: number | null; high: number | null } | null
  /** Guides and shades that fall inside the window, in time order. */
  guides: TrendGuide[]
  shades: TrendShade[]
}

const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** The list without repeats: two identical marks would only be drawn twice, one on the other. */
function uniqueBy<T>(list: readonly T[], key: (item: T) => string): T[] {
  return [...new Map(list.map((item) => [key(item), item])).values()]
}

const dayOf = (t: number) => new Date(t).toDateString()
const bound = (v: number | null | undefined): number | null => (finite(v) ? v : null)

/** Readings that can be drawn: a real date and a real number. */
function usable(list: readonly TrendPoint[] | undefined): TrendPoint[] {
  return (list ?? []).filter((p) => finite(p.value) && finite(p.at.getTime()))
}

function mergeSeries(raw: readonly TrendPoint[], smooth: readonly TrendPoint[]): TrendRow[] {
  const rows = new Map<number, TrendRow>()
  for (const p of raw) rows.set(p.at.getTime(), { t: p.at.getTime(), v: p.value })
  for (const p of smooth) {
    const t = p.at.getTime()
    rows.set(t, { ...rows.get(t), t, s: p.value })
  }
  return [...rows.values()].toSorted((a, b) => a.t - b.t)
}

/**
 * Everything the chart draws, decided once per set of readings: nothing here depends on the
 * width of the screen or on what the finger is touching. Null when there is nothing to draw.
 */
export function buildTrendModel(input: TrendInput): TrendModel | null {
  const xd = input.xDomain
  const window: [number, number] | null =
    xd && finite(xd[0]) && finite(xd[1]) && xd[1] > xd[0] ? [xd[0], xd[1]] : null
  const inWindow = (p: TrendPoint) =>
    !window || (p.at.getTime() >= window[0] && p.at.getTime() <= window[1])
  const raw = usable(input.points).filter(inWindow)
  const smooth = usable(input.smooth).filter(inWindow)
  const rows = mergeSeries(raw, smooth)
  const first = rows[0]
  const last = rows.at(-1)
  if (!first || !last) return null

  // Without a window the readings own the chart: a little room so the first and last sit
  // inside it, and a day around a lone reading.
  const span = last.t - first.t
  const pad = Math.max(span * 0.05, 4 * HOUR_MS)
  const domain: [number, number] =
    window ??
    (span > 0 ? [first.t - pad, last.t + pad] : [first.t - 12 * HOUR_MS, first.t + 12 * HOUR_MS])

  const target = finite(input.target) ? input.target : null
  const low = bound(input.refRange?.low)
  const high = bound(input.refRange?.high)
  const values = [
    ...rows.flatMap((r) => [r.v, r.s].filter(finite)),
    ...(target === null ? [] : [target]),
    ...(low === null ? [] : [low]),
    ...(high === null ? [] : [high]),
  ]

  const fixed = input.range
  return {
    rows,
    hasSmooth: rows.some((r) => r.s !== undefined),
    rawCount: rows.filter((r) => r.v !== undefined).length,
    domain,
    fixedWindow: window !== null,
    lo: Math.min(...values),
    hi: Math.max(...values),
    fixedRange:
      fixed && finite(fixed[0]) && finite(fixed[1]) && fixed[0] !== fixed[1]
        ? [Math.min(fixed[0], fixed[1]), Math.max(fixed[0], fixed[1])]
        : null,
    target,
    ref: low === null && high === null ? null : { low, high },
    guides: uniqueBy(
      (input.guides ?? []).filter((g) => finite(g.at) && g.at > domain[0] && g.at < domain[1]),
      (g) => `${g.at}|${g.color}|${g.label ?? ''}`,
    ).toSorted((a, b) => a.at - b.at),
    shades: uniqueBy(
      (input.shades ?? [])
        .filter((s) => finite(s.from) && finite(s.to) && s.to > s.from)
        .filter((s) => s.to > domain[0] && s.from < domain[1])
        .map((s) => ({
          color: s.color,
          from: Math.max(s.from, domain[0]),
          to: Math.min(s.to, domain[1]),
        })),
      (s) => `${s.from}|${s.to}|${s.color}`,
    ).toSorted((a, b) => a.from - b.from),
  }
}

/** The value a row stands for: the reading, else the trend at that instant. */
export const valueOf = (r: TrendRow): number | undefined => r.v ?? r.s

export interface TrendSummary {
  count: number
  from: number
  to: number
  first: number
  last: number
  min: number
  max: number
}

/** First, last, lowest and highest reading: the numbers the chart's description quotes. */
export function summarise(model: TrendModel): TrendSummary {
  const raw = model.rows.filter((r) => r.v !== undefined)
  const rows = raw.length > 0 ? raw : model.rows
  const values = rows.map((r) => valueOf(r) ?? Number.NaN).filter(finite)
  return {
    count: rows.length,
    from: rows[0]?.t ?? model.domain[0],
    to: rows.at(-1)?.t ?? model.domain[1],
    first: values[0] ?? 0,
    last: values.at(-1) ?? 0,
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

/** A number followed by its unit, kept together: "77,2 kg", "12 %", "7/10". */
export function withUnit(text: string, unit: string, locale: Locale): string {
  if (!unit) return text
  if (unit.startsWith('/')) return `${text}${unit}`
  if (unit === '%') return locale === 'es' ? `${text} %` : `${text}%`
  return `${text} ${unit}`
}

/**
 * How a date reads in the readout: the weekday for a few weeks, the year when the chart
 * reaches back far enough for it to matter, and the time when two readings share a day.
 */
export function readoutPattern(model: TrendModel): string {
  const days = (model.domain[1] - model.domain[0]) / DAY_MS
  const base = days > 200 ? 'd MMM yyyy' : 'EEE d MMM'
  const shared = model.rows.some((r, i) => i > 0 && dayOf(r.t) === dayOf(model.rows[i - 1]?.t ?? 0))
  return shared ? `${base}, HH:mm` : base
}

/** What one row says, line by line: when, the reading and, with a trend line, the trend then. */
export function describeReading(
  row: TrendRow,
  {
    pattern,
    dateLocale,
    locale,
    unit,
    digits,
    smoothLabel,
  }: {
    pattern: string
    dateLocale: DateLocale
    locale: Locale
    unit: string
    digits: number
    smoothLabel: string
  },
): string[] {
  const num = (v: number) => withUnit(fmtNumber(v, locale, digits), unit, locale)
  return [
    format(new Date(row.t), pattern, { locale: dateLocale }),
    ...(row.v === undefined ? [] : [num(row.v)]),
    ...(row.s === undefined ? [] : [`${smoothLabel} ${num(row.s)}`]),
  ]
}

/** What the chart says to a screen reader: what it shows, from when to when, and the extremes. */
export function describeTrend({
  model,
  t,
  locale,
  unit,
  digits,
  label,
}: {
  model: TrendModel
  t: TFunction
  locale: Locale
  unit: string
  digits: number
  label?: string
}): string {
  const fmt = (v: number) => withUnit(fmtNumber(v, locale, digits), unit, locale)
  const day = (ms: number) => fmtDate(new Date(ms), locale, 'd MMM yyyy')
  const s = summarise(model)
  const parts = [
    `${label ?? t('trend.title')}.`,
    t('trend.aria', {
      count: s.count,
      from: day(s.from),
      to: day(s.to),
      first: fmt(s.first),
      last: fmt(s.last),
      min: fmt(s.min),
      max: fmt(s.max),
    }),
  ]
  const { ref } = model
  if (ref) {
    const key =
      ref.low !== null && ref.high !== null
        ? 'trend.ariaRange'
        : ref.low !== null
          ? 'trend.ariaRangeLow'
          : 'trend.ariaRangeHigh'
    parts.push(t(key, { low: fmt(ref.low ?? 0), high: fmt(ref.high ?? 0) }))
  }
  if (model.target !== null) parts.push(t('trend.ariaTarget', { target: fmt(model.target) }))
  if (model.hasSmooth) parts.push(t('trend.ariaSmooth'))
  return parts.join(' ')
}
