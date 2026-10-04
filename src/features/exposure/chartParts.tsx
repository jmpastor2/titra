/**
 * Pieces the hand-drawn SVG charts share: axes, the label rail above the plot, the readout
 * line and the mark that says what happened to an administration. Everything is drawn with
 * CSS tokens so it follows the theme.
 */
import { format, type Locale as DateLocale } from 'date-fns'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { fmtNumber, type Locale } from '@/lib/format'
import type { PlacedLabel, PlotBox } from './chartLayout'
import type { AdminState } from './doseTimeline'

/** A mark on a chart's baseline: what happened to the administration at that time. */
export interface DoseMark {
  at: Date
  state: AdminState
}

export const AXIS_FONT = 11
export const LANE_H = 14

/** Horizontal grid with the value labels at the left; the baseline is drawn solid. */
export function YAxisGrid({
  ticks,
  box,
  y,
  decimals,
  locale,
}: {
  ticks: readonly number[]
  box: PlotBox
  y: (v: number) => number
  decimals: number
  locale: Locale
}) {
  return (
    <g aria-hidden>
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={box.x0}
            x2={box.x1}
            y1={y(v)}
            y2={y(v)}
            stroke={v === 0 ? 'var(--line-strong)' : 'var(--line)'}
            strokeDasharray={v === 0 ? undefined : '2 4'}
          />
          <text
            x={box.x0 - 6}
            y={y(v) + 4}
            textAnchor="end"
            fontSize={AXIS_FONT}
            fill="var(--muted)"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {fmtNumber(v, locale, decimals)}
          </text>
        </g>
      ))}
    </g>
  )
}

/** Time labels under the plot; the ones near an edge lean inward so they are never clipped. */
export function XAxisLabels({
  ticks,
  pattern,
  x,
  baselineY,
  width,
  dateLocale,
}: {
  ticks: readonly number[]
  pattern: string
  x: (ms: number) => number
  baselineY: number
  width: number
  dateLocale: DateLocale
}) {
  return (
    <g aria-hidden>
      {ticks.map((t) => {
        const px = x(t)
        return (
          <g key={t}>
            <line x1={px} x2={px} y1={baselineY} y2={baselineY + 3} stroke="var(--line-strong)" />
            <text
              x={px}
              y={baselineY + 16}
              textAnchor={px < 20 ? 'start' : px > width - 20 ? 'end' : 'middle'}
              fontSize={AXIS_FONT}
              fill="var(--muted)"
            >
              {format(new Date(t), pattern, { locale: dateLocale })}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export interface RailLabel {
  key: string
  text: string
  /** Set for the "now" tag, drawn heavier than the step labels. */
  strong?: boolean
}

/** Short labels above the plot, stacked in lanes so none overlaps another. */
export function RailLabels({
  placed,
  labels,
}: {
  placed: readonly PlacedLabel[]
  labels: ReadonlyMap<string, RailLabel>
}) {
  return (
    <g aria-hidden>
      {placed.map((p) => {
        const label = labels.get(p.key)
        if (!label) return null
        return (
          <text
            key={p.key}
            x={p.left}
            y={11 + p.lane * LANE_H}
            fontSize={label.strong ? 9.5 : 10}
            fontWeight={label.strong ? 700 : 600}
            fill="var(--ink-2)"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {label.text}
          </text>
        )
      })}
    </g>
  )
}

/**
 * The lines above a chart: the unit on the left and the reading on the right. It is a live
 * region, so what is under the finger is also read out. It keeps the height of its lines
 * whatever it says, so the chart below never moves when the finger does.
 */
export function ReadoutBar({
  unit,
  lines = 1,
  children,
}: {
  unit?: string
  /** How many lines the reading takes at most. */
  lines?: 1 | 2
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'flex items-baseline justify-between gap-3 px-1',
        lines === 2 ? 'min-h-[36px]' : 'min-h-[20px]',
      )}
    >
      <span className="spec shrink-0 text-[9.5px]">{unit}</span>
      <div aria-live="polite" className="min-w-0 text-right text-[11.5px] leading-tight">
        {children}
      </div>
    </div>
  )
}

/** The head of a lollipop; the state decides its shape, fill and ring. */
export function Head({
  state,
  cx,
  cy,
  r,
  color,
}: {
  state: AdminState
  cx: number
  cy: number
  r: number
  color: string
}) {
  return (
    <g data-mark={state}>
      <HeadShape state={state} cx={cx} cy={cy} r={r} color={color} />
    </g>
  )
}

function HeadShape({
  state,
  cx,
  cy,
  r,
  color,
}: {
  state: AdminState
  cx: number
  cy: number
  r: number
  color: string
}) {
  switch (state) {
    case 'late':
    case 'early':
      return (
        <g>
          <circle cx={cx} cy={cy} r={r + 2.6} fill="none" stroke="var(--warn)" strokeWidth={1.75} />
          <circle cx={cx} cy={cy} r={r} fill={color} />
        </g>
      )
    case 'extra':
      return (
        <rect
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={1.5}
          transform={`rotate(45 ${cx} ${cy})`}
          fill={color}
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
      )
    case 'missed':
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="var(--danger-soft)"
          stroke="var(--danger)"
          strokeWidth={1.75}
        />
      )
    case 'due':
      return (
        <g>
          <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="var(--warn)" strokeOpacity={0.35} />
          <circle cx={cx} cy={cy} r={r} fill="var(--panel)" stroke="var(--warn)" strokeWidth={2} />
        </g>
      )
    case 'planned':
      return <circle cx={cx} cy={cy} r={r} fill="var(--panel)" stroke={color} strokeWidth={1.5} />
    default:
      return <circle cx={cx} cy={cy} r={r} fill={color} stroke="var(--panel)" strokeWidth={1.5} />
  }
}
