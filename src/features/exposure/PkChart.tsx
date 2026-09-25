import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CurvePoint } from '@/domain/pk/engine'
import type { DoseEvent } from '@/domain/types'
import { fmtNumber, type Locale } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { amountScale, niceYAxis, timeTicks } from './chartScale'

export interface SymptomMarker {
  at: Date
  severity: number
  label: string
}

/** A vertical guide where a titration step starts, e.g. "↑ 4 mg". */
export interface StepMarker {
  at: Date
  label: string
}

export interface PkChartProps {
  history: CurvePoint[]
  projection?: CurvePoint[]
  /** Alternative scenario drawn in the accent colour (e.g. skip next dose). */
  alt?: CurvePoint[]
  altLabel?: string
  doses?: DoseEvent[]
  /** Future administrations of the plan, drawn as hollow markers. */
  planned?: DoseEvent[]
  steps?: StepMarker[]
  symptoms?: SymptomMarker[]
  now: Date
  height?: number
  /** Unit of the curve values. Amounts in mg switch to mcg when they are tiny. */
  unit?: string
  /** Series colour: the substance identity colour. */
  color?: string
  /** Steady-state band (trough to peak) for context. */
  ssBand?: { troughMg: number; peakMg: number }
}

const NO_POINTS: CurvePoint[] = []
const NO_DOSES: DoseEvent[] = []
const NO_STEPS: StepMarker[] = []
const NO_SYMPTOMS: SymptomMarker[] = []
const MARGIN = { top: 20, right: 14, bottom: 0, left: 0 }

interface Row {
  t: number
  hist?: number
  proj?: number
  alt?: number
}

export function PkChart({
  history,
  projection = NO_POINTS,
  alt,
  altLabel,
  doses = NO_DOSES,
  planned = NO_DOSES,
  steps = NO_STEPS,
  symptoms = NO_SYMPTOMS,
  now,
  height = 220,
  unit = 'mg',
  color = 'var(--chart-1)',
  ssBand,
}: PkChartProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dfl = locale === 'es' ? es : enUS
  const fillId = `pk-fill-${useId().replace(/:/g, '')}`

  const model = useMemo(() => {
    let rawMax = ssBand?.peakMg ?? 0
    for (const p of history) rawMax = Math.max(rawMax, p.mg)
    for (const p of projection) rawMax = Math.max(rawMax, p.mg)
    for (const p of alt ?? []) rawMax = Math.max(rawMax, p.mg)
    const scale = unit === 'mg' ? amountScale(rawMax) : { factor: 1, unit }
    const k = scale.factor

    const map = new Map<number, Row>()
    const put = (p: CurvePoint, key: 'hist' | 'proj' | 'alt') => {
      const t0 = p.at.getTime()
      map.set(t0, { ...(map.get(t0) ?? { t: t0 }), [key]: p.mg * k })
    }
    for (const p of history) put(p, 'hist')
    for (const p of projection) put(p, 'proj')
    for (const p of alt ?? []) put(p, 'alt')
    // Make projection continuous with history at the seam.
    const last = history[history.length - 1]
    if (last) {
      const seam = map.get(last.at.getTime())
      if (seam) {
        if (projection.length) seam.proj = last.mg * k
        if (alt?.length) seam.alt = last.mg * k
      }
    }
    const rows = [...map.values()].toSorted((a, b) => a.t - b.t)
    const domain: [number, number] = [rows[0]?.t ?? 0, rows[rows.length - 1]?.t ?? 1]
    const y = niceYAxis(rawMax * k)
    const x = timeTicks(domain[0], domain[1], 5)
    const nowT = now.getTime()
    const nowRow = last ? { t: last.at.getTime(), v: last.mg * k } : null
    return { rows, domain, y, x, k, unit: scale.unit, nowT, nowRow }
  }, [history, projection, alt, ssBand, unit, now])

  const { rows, domain, y, x, k } = model
  if (rows.length === 0) return null

  const inDomain = (d: Date) => d.getTime() >= domain[0] && d.getTime() <= domain[1]
  const span = Math.max(1, domain[1] - domain[0])
  const decimals = y.max < 1 ? 2 : y.max < 10 ? 1 : 0
  const yWidth = 10 + 7 * Math.max(...y.ticks.map((v) => fmtNumber(v, locale, decimals).length))
  const hasFuture = model.nowT < domain[1]

  return (
    <div style={{ height }} className="relative">
      <span className="spec pointer-events-none absolute left-0 top-0 text-[9.5px]">
        {model.unit}
      </span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={MARGIN}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
          {hasFuture && (
            <ReferenceArea
              x1={Math.max(model.nowT, domain[0])}
              x2={domain[1]}
              fill="var(--ink)"
              fillOpacity={0.035}
              stroke="none"
              ifOverflow="hidden"
            />
          )}
          {ssBand && (
            <ReferenceArea
              y1={ssBand.troughMg * k}
              y2={ssBand.peakMg * k}
              fill={color}
              fillOpacity={0.08}
              stroke="none"
              ifOverflow="hidden"
            />
          )}
          <XAxis
            dataKey="t"
            type="number"
            domain={domain}
            scale="time"
            ticks={x.ticks}
            interval={0}
            tickFormatter={(v: number) => format(new Date(v), x.pattern, { locale: dfl })}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, y.max]}
            ticks={y.ticks}
            interval={0}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmtNumber(v, locale, decimals)}
            width={yWidth}
          />
          {steps
            .filter((s) => inDomain(s.at))
            .map((s) => {
              const frac = (s.at.getTime() - domain[0]) / span
              return (
                <ReferenceLine
                  key={`step${s.at.getTime()}`}
                  x={s.at.getTime()}
                  stroke={color}
                  strokeOpacity={0.55}
                  strokeDasharray="2 3"
                  label={{
                    value: s.label,
                    position: frac > 0.72 ? 'insideTopRight' : 'insideTopLeft',
                    fill: 'var(--ink-2)',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )
            })}
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }}
            position={{ y: 0 }}
            allowEscapeViewBox={{ x: false, y: true }}
            content={<PkTooltip unit={model.unit} altLabel={altLabel} locale={locale} />}
          />
          <Area
            dataKey="hist"
            type="monotone"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            isAnimationActive={false}
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--panel)', fill: color }}
          />
          <Line
            dataKey="proj"
            type="monotone"
            stroke={color}
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--panel)', fill: color }}
          />
          {alt && (
            <Line
              dataKey="alt"
              type="monotone"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="2 4"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          )}
          {model.nowT >= domain[0] && model.nowT <= domain[1] && (
            <ReferenceLine
              x={model.nowT}
              stroke="var(--ink-2)"
              strokeOpacity={0.6}
              strokeWidth={1}
              label={{
                value: t('charts.now'),
                position: 'top',
                fill: 'var(--ink-2)',
                fontSize: 9.5,
                fontWeight: 700,
              }}
            />
          )}
          {doses
            .filter((d) => inDomain(d.at))
            .map((d) => (
              <ReferenceDot
                key={`d${d.at.getTime()}`}
                x={d.at.getTime()}
                y={0}
                r={3.5}
                fill={color}
                stroke="var(--panel)"
                strokeWidth={1.5}
                ifOverflow="visible"
              />
            ))}
          {planned
            .filter((d) => inDomain(d.at))
            .map((d) => (
              <ReferenceDot
                key={`p${d.at.getTime()}`}
                x={d.at.getTime()}
                y={0}
                r={3}
                fill="var(--panel)"
                stroke={color}
                strokeWidth={1.5}
                ifOverflow="visible"
              />
            ))}
          {symptoms
            .filter((s) => inDomain(s.at))
            .map((s) => (
              <ReferenceDot
                key={`s${s.at.getTime()}-${s.label}`}
                x={s.at.getTime()}
                y={y.max * 0.9}
                r={3 + Math.min(4, s.severity / 2.5)}
                fill="var(--chart-3)"
                stroke="var(--panel)"
                strokeWidth={2}
                ifOverflow="visible"
              />
            ))}
          {model.nowRow && (
            <ReferenceDot
              x={model.nowRow.t}
              y={model.nowRow.v}
              r={4.5}
              ifOverflow="visible"
              shape={<NowDot color={color} />}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** The current reading: a solid point with a soft static glow (no motion). */
function NowDot({ cx, cy, color }: { cx?: number; cy?: number; color: string }) {
  if (cx === undefined || cy === undefined || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return <g />
  }
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.18} />
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill={color}
        stroke="var(--panel)"
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </g>
  )
}

interface TooltipInjected {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown; value?: unknown }>
  label?: unknown
}

/** Recharts clones this element and injects active/payload/label. */
function PkTooltip({
  active,
  payload,
  label,
  unit,
  altLabel,
  locale,
}: TooltipInjected & { unit: string; altLabel?: string; locale: Locale }) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as Row | undefined
  if (!row) return null
  const v = row.hist ?? row.proj
  const digits = v !== undefined && v < 1 ? 2 : 1
  return (
    <div className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11.5px] shadow-lg">
      <div className="text-muted">
        {format(new Date(label as number), 'EEE d MMM, HH:mm', {
          locale: locale === 'es' ? es : enUS,
        })}
      </div>
      {v !== undefined && (
        <div className="readout font-semibold text-ink">
          {fmtNumber(v, locale, digits)} {unit}
          {row.hist === undefined && (
            <span className="ml-1 font-sans font-normal text-muted">
              · {t('dashboard.projection')}
            </span>
          )}
        </div>
      )}
      {row.alt !== undefined && altLabel && (
        <div className="readout text-ink-2">
          {fmtNumber(row.alt, locale, digits)} {unit} · {altLabel}
        </div>
      )}
    </div>
  )
}
