import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtNumber, type Locale } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { TREND_MARGIN as MARGIN, TREND_Y_AXIS_WIDTH as Y_AXIS_WIDTH, timeTicks } from './chartScale'

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

const DAY_MS = 86_400_000

const NO_GUIDES: TrendGuide[] = []
const NO_SHADES: TrendShade[] = []

/** One row per instant: the raw reading (v) and/or the smoothed trend (s). */
interface Row {
  t: number
  v?: number
  s?: number
}

function mergeSeries(raw: readonly TrendPoint[], smooth: readonly TrendPoint[] | undefined): Row[] {
  const rows = new Map<number, Row>()
  for (const p of raw) rows.set(p.at.getTime(), { t: p.at.getTime(), v: p.value })
  for (const p of smooth ?? []) {
    const t = p.at.getTime()
    rows.set(t, { ...rows.get(t), t, s: p.value })
  }
  return [...rows.values()].toSorted((a, b) => a.t - b.t)
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
}: {
  points: TrendPoint[]
  unit: string
  height?: number
  target?: number
  refRange?: { low?: number | null; high?: number | null }
  color?: string
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
  /** Tooltip label for the smoothed value, e.g. "Tendencia". */
  smoothLabel?: string
}) {
  const { locale } = useLocale()
  const dfl = locale === 'es' ? es : enUS

  const model = useMemo(() => {
    const inDomain = (p: TrendPoint) =>
      !xDomain || (p.at.getTime() >= xDomain[0] && p.at.getTime() <= xDomain[1])
    const data = mergeSeries(points.filter(inDomain), smooth?.filter(inDomain))
    if (data.length === 0) return null
    const vals = data.flatMap((d) => [d.v, d.s].filter((x): x is number => x !== undefined))
    const lo = Math.min(...vals, target ?? Infinity, refRange?.low ?? Infinity)
    const hi = Math.max(...vals, target ?? -Infinity, refRange?.high ?? -Infinity)
    const pad = (hi - lo) * 0.15 || 1
    const domain: [number, number] = xDomain ?? [data[0]!.t, data[data.length - 1]!.t]
    const x = timeTicks(domain[0], domain[1], 4)
    const span = (domain[1] - domain[0]) / DAY_MS
    const pattern = x.pattern === 'MMM' && span > 300 ? 'MMM yy' : x.pattern
    return {
      data,
      yDomain: range ?? ([lo - pad, hi + pad] as [number, number]),
      domain,
      x,
      pattern,
    }
  }, [points, smooth, xDomain, target, refRange?.low, refRange?.high, range])

  if (!model) return null
  const { data, domain } = model
  const hasSmooth = data.some((d) => d.s !== undefined)
  const rawCount = data.filter((d) => d.v !== undefined).length
  const visibleGuides = guides.filter((g) => g.at > domain[0] && g.at < domain[1])
  const visibleShades = shades.filter((s) => s.to > domain[0] && s.from < domain[1])

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={MARGIN}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
          {visibleShades.map((s) => (
            <ReferenceArea
              key={`sh${s.from}-${s.color}`}
              x1={Math.max(s.from, domain[0])}
              x2={Math.min(s.to, domain[1])}
              fill={s.color}
              fillOpacity={0.08}
              stroke="none"
              ifOverflow="hidden"
            />
          ))}
          {visibleGuides.map((g) => (
            <ReferenceLine
              key={`g${g.at}-${g.color}`}
              x={g.at}
              stroke={g.color}
              strokeOpacity={0.6}
              strokeDasharray="2 3"
              label={
                g.label
                  ? {
                      value: g.label,
                      position: 'insideTopLeft',
                      fill: 'var(--muted)',
                      fontSize: 9.5,
                      fontFamily: 'var(--font-mono)',
                    }
                  : undefined
              }
            />
          ))}
          <XAxis
            dataKey="t"
            type="number"
            domain={domain}
            scale="time"
            ticks={model.x.ticks}
            interval={0}
            tickFormatter={(v: number) => format(new Date(v), model.pattern, { locale: dfl })}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={model.yDomain}
            ticks={range ? [range[0], (range[0] + range[1]) / 2, range[1]] : undefined}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmtNumber(v, locale, digits)}
            width={Y_AXIS_WIDTH}
          />
          {refRange?.low != null && (
            <ReferenceLine
              y={refRange.low}
              stroke="var(--chart-5)"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
          )}
          {refRange?.high != null && (
            <ReferenceLine
              y={refRange.high}
              stroke="var(--chart-5)"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
          )}
          {target != null && (
            <ReferenceLine y={target} stroke="var(--chart-2)" strokeDasharray="4 4" />
          )}
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }}
            content={
              <TrendTooltip unit={unit} digits={digits} locale={locale} smoothLabel={smoothLabel} />
            }
          />
          <Line
            dataKey="v"
            type="monotone"
            stroke={color}
            strokeWidth={hasSmooth ? 1 : 2}
            strokeOpacity={hasSmooth ? 0.35 : 1}
            connectNulls
            style={
              hasSmooth
                ? undefined
                : { filter: `drop-shadow(0 0 4px color-mix(in oklab, ${color} 60%, transparent))` }
            }
            dot={
              rawCount <= 40 || hasSmooth
                ? {
                    r: hasSmooth ? 2.5 : 3,
                    strokeWidth: hasSmooth ? 1.5 : 2,
                    stroke: 'var(--panel)',
                    fill: color,
                    fillOpacity: hasSmooth ? 0.7 : 1,
                  }
                : false
            }
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--panel)', fill: color }}
            isAnimationActive={false}
          />
          {hasSmooth && (
            <Line
              dataKey="s"
              type="monotone"
              stroke={color}
              strokeWidth={2.25}
              connectNulls
              style={{
                filter: `drop-shadow(0 0 4px color-mix(in oklab, ${color} 60%, transparent))`,
              }}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipInjected {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown; dataKey?: unknown }>
  label?: unknown
}

/** Recharts clones this element and injects active/payload/label. */
function TrendTooltip({
  active,
  payload,
  label,
  unit,
  digits,
  locale,
  smoothLabel,
}: TooltipInjected & { unit: string; digits: number; locale: Locale; smoothLabel: string }) {
  if (!active || !payload?.length) return null
  const pick = (key: string) => {
    const v = payload.find((p) => p.dataKey === key)?.value
    return typeof v === 'number' ? v : null
  }
  const v = pick('v')
  const s = pick('s')
  if (v === null && s === null) return null
  return (
    <div className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11.5px] shadow-lg">
      <div className="text-muted">
        {format(new Date(label as number), 'd MMM yyyy', { locale: locale === 'es' ? es : enUS })}
      </div>
      {v !== null && (
        <div className="readout font-semibold text-ink">
          {fmtNumber(v, locale, digits)} {unit}
        </div>
      )}
      {s !== null && (
        <div className="readout text-muted">
          {smoothLabel} {fmtNumber(s, locale, digits)} {unit}
        </div>
      )}
    </div>
  )
}
