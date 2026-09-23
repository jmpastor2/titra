import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
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

export interface SymptomMarker {
  at: Date
  severity: number
  label: string
}

export interface PkChartProps {
  history: CurvePoint[]
  projection?: CurvePoint[]
  /** Alternative scenario drawn in the accent colour (e.g. skip next dose). */
  alt?: CurvePoint[]
  altLabel?: string
  doses?: DoseEvent[]
  symptoms?: SymptomMarker[]
  now: Date
  height?: number
  unit?: string
  /** Steady-state band (avg ± peak/trough) for context. */
  ssBand?: { troughMg: number; peakMg: number }
}

const NO_POINTS: CurvePoint[] = []
const NO_DOSES: DoseEvent[] = []
const NO_SYMPTOMS: SymptomMarker[] = []

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
  symptoms = NO_SYMPTOMS,
  now,
  height = 220,
  unit = 'mg',
  ssBand,
}: PkChartProps) {
  const { i18n } = useTranslation()
  const locale: Locale = i18n.language.startsWith('en') ? 'en' : 'es'
  const dfl = locale === 'es' ? es : enUS

  const rows = useMemo<Row[]>(() => {
    const map = new Map<number, Row>()
    for (const p of history) {
      const t0 = p.at.getTime()
      map.set(t0, { ...(map.get(t0) ?? { t: t0 }), hist: p.mg })
    }
    for (const p of projection) {
      const t0 = p.at.getTime()
      map.set(t0, { ...(map.get(t0) ?? { t: t0 }), proj: p.mg })
    }
    for (const p of alt ?? []) {
      const t0 = p.at.getTime()
      map.set(t0, { ...(map.get(t0) ?? { t: t0 }), alt: p.mg })
    }
    // Make projection continuous with history at the seam.
    const last = history[history.length - 1]
    if (last) {
      const seam = map.get(last.at.getTime())
      if (seam) {
        if (projection.length) seam.proj = last.mg
        if (alt?.length) seam.alt = last.mg
      }
    }
    return [...map.values()].toSorted((a, b) => a.t - b.t)
  }, [history, projection, alt])

  const domain = useMemo<[number, number]>(() => {
    const ts = rows.map((r) => r.t)
    return [Math.min(...ts), Math.max(...ts)]
  }, [rows])

  const yMax = useMemo(() => {
    let m = 0
    for (const r of rows) m = Math.max(m, r.hist ?? 0, r.proj ?? 0, r.alt ?? 0)
    if (ssBand) m = Math.max(m, ssBand.peakMg)
    return m * 1.15 || 1
  }, [rows, ssBand])

  const spanDays = (domain[1] - domain[0]) / 86_400_000
  const tickFmt = (v: number) =>
    format(new Date(v), spanDays > 60 ? 'd MMM' : 'EEE d', { locale: dfl })

  const doseMarkers = doses.filter(
    (d) => d.at.getTime() >= domain[0] && d.at.getTime() <= domain[1],
  )
  const symptomMarkers = symptoms.filter(
    (s) => s.at.getTime() >= domain[0] && s.at.getTime() <= domain[1],
  )

  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="pkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
          <XAxis
            dataKey="t"
            type="number"
            domain={domain}
            scale="time"
            tickFormatter={tickFmt}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={36}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmtNumber(v, locale, v < 1 ? 2 : 1)}
            width={48}
          />
          {ssBand && (
            <>
              <ReferenceLine
                y={ssBand.peakMg}
                stroke="var(--chart-5)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={ssBand.troughMg}
                stroke="var(--chart-5)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            </>
          )}
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }}
            content={<PkTooltip unit={unit} altLabel={altLabel} />}
          />
          <Area
            dataKey="hist"
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#pkFill)"
            isAnimationActive={false}
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
          <Line
            dataKey="proj"
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
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
          <ReferenceLine
            x={now.getTime()}
            stroke="var(--ink-2)"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
          {doseMarkers.map((d) => (
            <ReferenceDot
              key={`d${d.at.getTime()}`}
              x={d.at.getTime()}
              y={0}
              r={4}
              fill="var(--chart-1)"
              stroke="var(--surface)"
              strokeWidth={2}
              ifOverflow="visible"
            />
          ))}
          {symptomMarkers.map((s) => (
            <ReferenceDot
              key={`s${s.at.getTime()}-${s.label}`}
              x={s.at.getTime()}
              y={yMax * 0.96}
              r={3 + Math.min(4, s.severity / 2.5)}
              fill="var(--chart-3)"
              stroke="var(--surface)"
              strokeWidth={2}
              ifOverflow="visible"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
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
}: TooltipInjected & { unit: string; altLabel?: string }) {
  const { t, i18n } = useTranslation()
  const locale: Locale = i18n.language.startsWith('en') ? 'en' : 'es'
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as Row | undefined
  if (!row) return null
  const v = row.hist ?? row.proj
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-[12px] shadow-card">
      <div className="text-muted">
        {format(new Date(label as number), 'EEE d MMM, HH:mm', {
          locale: locale === 'es' ? es : enUS,
        })}
      </div>
      {v !== undefined && (
        <div className="tabular font-semibold">
          {fmtNumber(v, locale, 2)} {unit}
          {row.proj !== undefined && row.hist === undefined && (
            <span className="ml-1 font-normal text-muted">· {t('dashboard.projection')}</span>
          )}
        </div>
      )}
      {row.alt !== undefined && altLabel && (
        <div className="tabular text-accent">
          {fmtNumber(row.alt, locale, 2)} {unit} · {altLabel}
        </div>
      )}
    </div>
  )
}
