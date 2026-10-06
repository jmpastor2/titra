import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CurvePoint } from '@/domain/pk/engine'
import type { DoseEvent, DoseUnit } from '@/domain/types'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import {
  areaPath,
  estimateTextWidth,
  linePath,
  nearestIndex,
  placeLabels,
  plotBox,
  scaleLinear,
  type Pt,
} from './chartLayout'
import { readoutDigits, timeTicks } from './chartScale'
import {
  Head,
  LANE_H,
  RailLabels,
  ReadoutBar,
  XAxisLabels,
  YAxisGrid,
  type DoseMark,
  type RailLabel,
} from './chartParts'
import { buildPkModel, type PkRow, type SsBand } from './pkModel'
import { stepPriority } from './stepLabels'
import { useChartPointer } from './useChartPointer'
import { useChartWidth } from './useChartWidth'

export type { SsBand }

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
  /** Alternative scenario drawn dotted in `altColor` (e.g. skip next dose). */
  alt?: CurvePoint[]
  altLabel?: string
  altColor?: string
  doses?: DoseEvent[]
  /** Future administrations of the plan, drawn as hollow markers. */
  planned?: DoseEvent[]
  /** What happened to each administration (taken, off the hour, extra, missed, due, planned).
   * When given, these are drawn on the baseline instead of `doses` and `planned`. */
  marks?: DoseMark[]
  /** Administrations a scenario leaves out, drawn crossed in `altColor`. */
  crossed?: DoseEvent[]
  steps?: StepMarker[]
  symptoms?: SymptomMarker[]
  /** Steady-state range of each dosing step, drawn as a stepped band. */
  bands?: SsBand[]
  /** One steady-state range for the whole chart (kept for callers that have a single regimen). */
  ssBand?: { troughMg: number; peakMg: number }
  now: Date
  height?: number
  /** The unit the person doses in; amounts are shown in it. */
  unit?: DoseUnit
  /** Series colour: the substance identity colour. */
  color?: string
  /** Accessible description of the chart. */
  label?: string
}

const NO_POINTS: CurvePoint[] = []
const NO_DOSES: DoseEvent[] = []
const NO_STEPS: StepMarker[] = []
const NO_SYMPTOMS: SymptomMarker[] = []
const NO_BANDS: SsBand[] = []
const RIGHT = 12
const BOTTOM = 22
const RAIL_TOP = 6

/** The level a row reads: what was reached so far, else what is projected. */
const levelOf = (r: PkRow) => r.hist ?? r.proj

/** One mark per instant, so the markers can be keyed by time. */
function oneAt<T extends { at: Date }>(list: readonly T[]): T[] {
  return [...new Map(list.map((d) => [d.at.getTime(), d])).values()]
}

export function PkChart({
  history,
  projection = NO_POINTS,
  alt,
  altLabel,
  altColor = 'var(--ink-2)',
  doses = NO_DOSES,
  planned = NO_DOSES,
  marks,
  crossed = NO_DOSES,
  steps = NO_STEPS,
  symptoms = NO_SYMPTOMS,
  bands: stepBands = NO_BANDS,
  ssBand,
  now,
  height = 220,
  unit,
  color = 'var(--chart-1)',
  label,
}: PkChartProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dfl = locale === 'es' ? es : enUS
  const gradId = `pk-fill-${useId().replace(/\W/g, '')}`
  const [ref, width] = useChartWidth()

  // A single range spans the whole history and projection, as the step in force.
  const bands = useMemo<SsBand[]>(() => {
    if (!ssBand) return stepBands
    const times = [...history, ...projection].map((p) => p.at.getTime())
    const from = new Date(Math.min(...times))
    const to = new Date(Math.max(...times))
    return [{ ...ssBand, from, to, current: true }, ...stepBands]
  }, [ssBand, stepBands, history, projection])
  const model = useMemo(
    () => buildPkModel({ history, projection, alt, bands, unit }),
    [history, projection, alt, bands, unit],
  )
  const { rows, domain, factor, yMax, yTicks, decimals } = model
  const nowT = now.getTime()
  const [d0, d1] = domain
  const span = Math.max(1, d1 - d0)

  // Layout: the y labels set the left inset, the rail of step labels sets the top one.
  const yLabelW = 10 + 6.4 * Math.max(...yTicks.map((v) => fmtNumber(v, locale, decimals).length))
  const draftX = scaleLinear(d0, d1, yLabelW, width - RIGHT)
  const inDomain = (ms: number) => ms >= d0 && ms <= d1
  const railLabels = new Map<string, RailLabel>()
  const specs = steps
    .filter((s) => inDomain(s.at.getTime()))
    .map((s) => {
      const key = `step-${s.at.getTime()}`
      railLabels.set(key, { key, text: s.label })
      return {
        key,
        x: draftX(s.at.getTime()),
        width: estimateTextWidth(s.label, 10, 6),
        priority: stepPriority(
          s.at.getTime(),
          nowT,
          steps.map((m) => m.at.getTime()),
        ),
      }
    })
  if (inDomain(nowT)) {
    const text = t('charts.now')
    railLabels.set('now', { key: 'now', text, strong: true })
    specs.push({ key: 'now', x: draftX(nowT), width: estimateTextWidth(text, 9.5, 6), priority: 9 })
  }
  const placed = placeLabels(specs, [yLabelW, width - RIGHT], 2)
  const lanes = placed.reduce((m, p) => Math.max(m, p.lane + 1), 0)
  const box = plotBox(width, height, {
    left: yLabelW,
    right: RIGHT,
    top: RAIL_TOP + lanes * LANE_H + 4,
    bottom: BOTTOM,
  })
  const { x0, x1, y0, y1 } = box
  const { x, y } = useMemo(
    () => ({ x: scaleLinear(d0, d1, x0, x1), y: scaleLinear(0, yMax, y1, y0) }),
    [d0, d1, x0, x1, y0, y1, yMax],
  )
  const tickCount = Math.max(3, Math.min(6, Math.floor(box.width / 46)))
  const xTicks = timeTicks(d0, d1, tickCount)

  const paths = useMemo(() => {
    const pts = (key: 'hist' | 'proj' | 'alt'): Pt[] =>
      rows.flatMap((r) => {
        const v = r[key]
        return v === undefined ? [] : [[x(r.t), y(v * factor)] as const]
      })
    const hist = pts('hist')
    return {
      area: areaPath(hist, y1),
      hist: linePath(hist),
      proj: linePath(pts('proj')),
      alt: alt ? linePath(pts('alt')) : '',
    }
  }, [rows, factor, alt, x, y, y1])

  const { svgRef, selected, handlers } = useChartPointer({
    count: rows.length,
    box,
    indexAt: (px) => nearestIndex(model.times, d0 + ((px - x0) / box.width) * span),
    start: Math.max(0, nearestIndex(model.times, nowT)),
  })

  if (rows.length === 0) return null

  const nowRow = rows.find((r) => r.t === nowT && r.hist !== undefined)
  const nowValue = nowRow?.hist
  const sel = selected !== null ? rows[selected] : undefined
  const fmt = (mg: number) => {
    const v = mg * factor
    return fmtNumber(v, locale, readoutDigits(v))
  }
  const hasFuture = nowT < d1
  const baseline = oneAt<DoseMark>(
    marks ?? [
      ...doses.map((d) => ({ at: d.at, state: 'taken' as const })),
      ...planned.map((d) => ({ at: d.at, state: 'planned' as const })),
    ],
  )

  return (
    <div ref={ref}>
      <ReadoutBar unit={model.unit} lines={alt ? 2 : 1}>
        {sel ? (
          <>
            <span className="text-muted">
              {format(new Date(sel.t), 'EEE d MMM, HH:mm', { locale: dfl })}
            </span>{' '}
            {levelOf(sel) !== undefined && (
              <span className="readout font-semibold text-ink">
                {fmt(levelOf(sel) ?? 0)} {model.unit}
              </span>
            )}
            {sel.hist === undefined && (
              <span className="text-muted"> · {t('charts.projection')}</span>
            )}
            {sel.alt !== undefined && altLabel && (
              <span className="readout block font-semibold" style={{ color: altColor }}>
                {fmt(sel.alt)} {model.unit} · {altLabel}
              </span>
            )}
          </>
        ) : nowValue !== undefined ? (
          <>
            <span className="text-muted">{t('charts.now')} · </span>
            <span className="readout font-semibold text-ink">
              {fmt(nowValue)} {model.unit}
            </span>
          </>
        ) : null}
      </ReadoutBar>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={label ?? t('charts.exposureAria')}
        tabIndex={0}
        className="block touch-pan-y select-none outline-none focus-visible:ring-1 focus-visible:ring-signal/50"
        {...handlers}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
          <clipPath id={`${gradId}-clip`}>
            <rect x={box.x0} y={box.y0 - 2} width={box.width} height={box.height + 4} />
          </clipPath>
        </defs>

        <YAxisGrid ticks={yTicks} box={box} y={y} decimals={decimals} locale={locale} />

        <g clipPath={`url(#${gradId}-clip)`}>
          {hasFuture && (
            <rect
              x={x(Math.max(nowT, d0))}
              y={box.y0}
              width={Math.max(0, box.x1 - x(Math.max(nowT, d0)))}
              height={box.height}
              fill="var(--ink)"
              fillOpacity={0.035}
            />
          )}
          {bands.map((b) => {
            const left = x(Math.max(b.from.getTime(), d0))
            const right = x(Math.min(b.to.getTime(), d1))
            if (!(right > left)) return null
            const top = y(Math.min(b.peakMg * factor, yMax))
            return (
              <rect
                key={`band-${b.from.getTime()}`}
                x={left}
                y={top}
                width={right - left}
                height={Math.max(0, y(b.troughMg * factor) - top)}
                fill={color}
                fillOpacity={b.current ? 0.13 : 0.07}
              />
            )
          })}
          {steps
            .filter((s) => inDomain(s.at.getTime()))
            .map((s) => (
              <line
                key={`guide-${s.at.getTime()}`}
                x1={x(s.at.getTime())}
                x2={x(s.at.getTime())}
                y1={box.y0}
                y2={box.y1}
                stroke={color}
                strokeOpacity={0.55}
                strokeDasharray="2 3"
              />
            ))}
          <path d={paths.area} fill={`url(#${gradId})`} />
          <path
            d={paths.hist}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={paths.proj}
            fill="none"
            stroke={color}
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
          {alt && (
            <path
              d={paths.alt}
              fill="none"
              stroke={altColor}
              strokeWidth={2}
              strokeDasharray="2 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        {inDomain(nowT) && (
          <line
            x1={x(nowT)}
            x2={x(nowT)}
            y1={box.y0}
            y2={box.y1}
            stroke="var(--ink-2)"
            strokeOpacity={0.6}
          />
        )}

        {baseline
          .filter((m) => inDomain(m.at.getTime()))
          .map((m) => (
            <Head
              key={`${m.state}-${m.at.getTime()}`}
              state={m.state}
              cx={x(m.at.getTime())}
              cy={box.y1}
              r={3.4}
              color={color}
            />
          ))}
        {oneAt(crossed)
          .filter((d) => inDomain(d.at.getTime()))
          .map((d) => (
            <path
              key={`c${d.at.getTime()}`}
              d={`M${x(d.at.getTime()) - 3.5} ${box.y1 - 3.5} l7 7 m-7 0 l7 -7`}
              stroke={altColor}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        {symptoms
          .filter((s) => inDomain(s.at.getTime()))
          .map((s) => (
            <circle
              key={`s${s.at.getTime()}-${s.label}`}
              cx={x(s.at.getTime())}
              cy={y(yMax * 0.9)}
              r={3 + Math.min(4, s.severity / 2.5)}
              fill="var(--chart-3)"
              fillOpacity={0.9}
              stroke="var(--panel)"
              strokeWidth={2}
            />
          ))}

        {nowValue !== undefined && (
          <g pointerEvents="none">
            <circle
              cx={x(nowT)}
              cy={y(nowValue * factor)}
              r={4.5}
              fill={color}
              stroke="var(--panel)"
              strokeWidth={2.5}
            />
          </g>
        )}

        {sel && levelOf(sel) !== undefined && (
          <g pointerEvents="none">
            <line
              x1={x(sel.t)}
              x2={x(sel.t)}
              y1={box.y0}
              y2={box.y1}
              stroke="var(--ink-2)"
              strokeWidth={1}
            />
            <circle
              cx={x(sel.t)}
              cy={y((levelOf(sel) ?? 0) * factor)}
              r={4}
              fill={color}
              stroke="var(--panel)"
              strokeWidth={2}
            />
            {sel.alt !== undefined && (
              <circle
                cx={x(sel.t)}
                cy={y(sel.alt * factor)}
                r={3.5}
                fill={altColor}
                stroke="var(--panel)"
                strokeWidth={2}
              />
            )}
          </g>
        )}

        <XAxisLabels
          ticks={xTicks.ticks}
          pattern={xTicks.pattern}
          x={x}
          baselineY={box.y1}
          width={width}
          dateLocale={dfl}
        />
        <RailLabels placed={placed} labels={railLabels} />
      </svg>
    </div>
  )
}
