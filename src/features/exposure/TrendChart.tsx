import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtNumber, type Locale } from '@/lib/format'

export interface TrendPoint {
  at: Date
  value: number
}

export function TrendChart({
  points,
  unit,
  height = 180,
  target,
  refRange,
  color = 'var(--chart-1)',
  digits = 1,
}: {
  points: TrendPoint[]
  unit: string
  height?: number
  target?: number
  refRange?: { low?: number | null; high?: number | null }
  color?: string
  digits?: number
}) {
  const { i18n } = useTranslation()
  const locale: Locale = i18n.language.startsWith('en') ? 'en' : 'es'
  const dfl = locale === 'es' ? es : enUS
  const data = [...points]
    .toSorted((a, b) => a.at.getTime() - b.at.getTime())
    .map((p) => ({ t: p.at.getTime(), v: p.value }))
  if (data.length === 0) return null
  const vals = data.map((d) => d.v)
  const lo = Math.min(...vals, target ?? Infinity, refRange?.low ?? Infinity)
  const hi = Math.max(...vals, target ?? -Infinity, refRange?.high ?? -Infinity)
  const pad = (hi - lo) * 0.15 || 1
  const span = (data[data.length - 1]!.t - data[0]!.t) / 86_400_000

  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -14 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={(v: number) =>
              format(new Date(v), span > 60 ? 'MMM yy' : 'd MMM', { locale: dfl })
            }
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={[lo - pad, hi + pad]}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmtNumber(v, locale, digits)}
            width={44}
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
            content={<TrendTooltip unit={unit} digits={digits} />}
          />
          <Line
            dataKey="v"
            type="monotone"
            stroke={color}
            strokeWidth={2}
            dot={
              data.length <= 40
                ? { r: 3, strokeWidth: 2, stroke: 'var(--surface)', fill: color }
                : false
            }
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipInjected {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown }>
  label?: unknown
}

/** Recharts clones this element and injects active/payload/label. */
function TrendTooltip({
  active,
  payload,
  label,
  unit,
  digits,
}: TooltipInjected & { unit: string; digits: number }) {
  const { i18n } = useTranslation()
  const locale: Locale = i18n.language.startsWith('en') ? 'en' : 'es'
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  if (typeof v !== 'number') return null
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-[12px] shadow-card">
      <div className="text-muted">
        {format(new Date(label as number), 'd MMM yyyy', { locale: locale === 'es' ? es : enUS })}
      </div>
      <div className="tabular font-semibold">
        {fmtNumber(v, locale, digits)} {unit}
      </div>
    </div>
  )
}
