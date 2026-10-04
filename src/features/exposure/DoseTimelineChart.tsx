/**
 * One lollipop per administration over a window: the bar is the dose in the unit the
 * person doses in, the head says what happened to it (taken, off the hour, extra, missed,
 * due, planned). The honest picture for substances whose level is not worth a curve.
 */
import { enUS, es } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DoseUnit } from '@/domain/types'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import {
  dodge,
  estimateTextWidth,
  nearestIndex,
  placeLabels,
  plotBox,
  scaleLinear,
} from './chartLayout'
import { niceYAxis, tickDecimals, timeTicks, unitScale } from './chartScale'
import {
  Head,
  LANE_H,
  RailLabels,
  ReadoutBar,
  XAxisLabels,
  YAxisGrid,
  type RailLabel,
} from './chartParts'
import type { AdminState, TimelineModel } from './doseTimeline'
import { stepLabel, stepPriority } from './stepLabels'
import { describeTimelineItem } from './timelineText'
import { useChartPointer } from './useChartPointer'
import { useChartWidth } from './useChartWidth'

const RIGHT = 12
const BOTTOM = 22
const RAIL_TOP = 6

export interface DoseTimelineChartProps {
  model: TimelineModel
  now: Date
  /** Series colour: the substance identity colour. */
  color: string
  /** The unit the person doses in. */
  unit: DoseUnit
  height?: number
}

function stemStyle(state: AdminState, color: string, dense: boolean) {
  const base =
    state === 'missed'
      ? { stroke: 'var(--danger)', opacity: 0.7, dash: '2 3' }
      : state === 'planned'
        ? { stroke: color, opacity: 0.4, dash: '2 3' }
        : state === 'due'
          ? { stroke: 'var(--warn)', opacity: 0.6, dash: '2 3' }
          : { stroke: color, opacity: 0.55, dash: undefined }
  // A packed range would turn the stems into a hatched block: fainter, the heads still read.
  return dense ? { ...base, opacity: base.opacity * 0.6 } : base
}

export function DoseTimelineChart({
  model,
  now,
  color,
  unit,
  height = 190,
}: DoseTimelineChartProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dfl = locale === 'es' ? es : enUS
  const [ref, width] = useChartWidth()
  const { factor, label: unitLabel } = unitScale(unit)
  const { items, from, to } = model
  const d0 = from.getTime()
  const d1 = to.getTime()
  const nowT = now.getTime()
  const inWindow = (ms: number) => ms >= d0 && ms <= d1

  const y = useMemo(() => niceYAxis(model.maxMg * factor), [model.maxMg, factor])
  const decimals = tickDecimals(y.ticks)
  const yLabelW = 10 + 6.4 * Math.max(...y.ticks.map((v) => fmtNumber(v, locale, decimals).length))

  const labels = new Map<string, RailLabel>()
  const draftX = scaleLinear(d0, d1, yLabelW, width - RIGHT)
  const specs = model.steps.map((c) => {
    const key = `step-${c.at.getTime()}`
    const text = stepLabel(c, unit, locale, t('charts.pause'))
    labels.set(key, { key, text })
    return {
      key,
      x: draftX(c.at.getTime()),
      width: estimateTextWidth(text, 10, 6),
      priority: stepPriority(
        c.at.getTime(),
        nowT,
        model.steps.map((m) => m.at.getTime()),
      ),
    }
  })
  if (inWindow(nowT)) {
    const text = t('charts.now')
    labels.set('now', { key: 'now', text, strong: true })
    specs.push({ key: 'now', x: draftX(nowT), width: estimateTextWidth(text, 9.5, 6), priority: 9 })
  }
  const placed = placeLabels(specs, [yLabelW, width - RIGHT], 2)
  const lanes = placed.reduce((m, p) => Math.max(m, p.lane + 1), 0)
  const box = plotBox(width, height, {
    left: yLabelW,
    right: RIGHT,
    top: RAIL_TOP + lanes * LANE_H + 8,
    bottom: BOTTOM,
  })
  const x = scaleLinear(d0, d1, box.x0, box.x1)
  const yScale = scaleLinear(0, y.max, box.y1, box.y0)
  // Heads shrink as the days get crowded: one lollipop per day at 3 px a day is a comb.
  const pxPerDay = box.width / Math.max(1, (d1 - d0) / 86_400_000)
  const r = Math.max(2.2, Math.min(5, pxPerDay * 0.34))
  const stem = r < 3.4 ? 1.25 : 1.75
  // Two doses within the hour sit on the same spot: nudged apart so both can be seen and tapped.
  const xs = dodge(
    items.map((i) => x(i.at.getTime())),
    r * 1.8,
    r,
  )

  const { svgRef, selected, handlers } = useChartPointer({
    count: items.length,
    box,
    indexAt: (px) => nearestIndex(xs, px),
    // The arrow keys begin at what the readout already shows: the next dose, else the last.
    start: Math.max(0, model.next ? items.indexOf(model.next) : items.length - 1),
  })

  const xTicks = timeTicks(d0, d1, Math.max(3, Math.min(9, Math.floor(box.width / 46))), 0.02)
  const sel = selected !== null ? items[selected] : undefined
  const selX = selected !== null ? xs[selected] : undefined
  const focus = sel ?? model.next ?? items.findLast((i) => i.takenAt) ?? null
  const described = focus ? describeTimelineItem(focus, unit, locale, t) : null
  const aria = t('charts.timeline.aria', {
    taken: model.summary.taken + model.summary.extras,
    missed: model.summary.missed,
    planned: items.filter((i) => i.state === 'planned' || i.state === 'due').length,
  })

  return (
    <div ref={ref}>
      <ReadoutBar unit={unitLabel} lines={2}>
        {described && focus ? (
          <>
            <span className="block text-muted">
              {!sel && `${t(focus.takenAt ? 'charts.timeline.last' : 'charts.timeline.next')} · `}
              {described.when}
            </span>
            <span className="block">
              <span className="readout font-semibold text-ink">{described.dose}</span>
              <span className="text-muted">
                {' · '}
                {described.status}
                {described.plan && ` · ${described.plan}`}
              </span>
            </span>
          </>
        ) : null}
      </ReadoutBar>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={aria}
        tabIndex={0}
        className="block touch-pan-y select-none outline-none focus-visible:ring-1 focus-visible:ring-signal/50"
        {...handlers}
      >
        <YAxisGrid ticks={y.ticks} box={box} y={yScale} decimals={decimals} locale={locale} />

        {inWindow(nowT) && nowT < d1 && (
          <rect
            x={x(nowT)}
            y={box.y0}
            width={Math.max(0, box.x1 - x(nowT))}
            height={box.height}
            fill="var(--ink)"
            fillOpacity={0.035}
          />
        )}
        {model.steps
          .filter((c) => inWindow(c.at.getTime()))
          .map((c) => (
            <line
              key={`guide-${c.at.getTime()}`}
              x1={x(c.at.getTime())}
              x2={x(c.at.getTime())}
              y1={box.y0}
              y2={box.y1}
              stroke={color}
              strokeOpacity={0.55}
              strokeDasharray="2 3"
            />
          ))}
        {inWindow(nowT) && (
          <line
            x1={x(nowT)}
            x2={x(nowT)}
            y1={box.y0}
            y2={box.y1}
            stroke="var(--ink-2)"
            strokeOpacity={0.6}
          />
        )}

        {items.map((item, i) => {
          const px = xs[i] ?? 0
          const py = yScale(item.doseMg * factor)
          const s = stemStyle(item.state, color, r < 3.4)
          return (
            <g key={item.key} data-state={item.state} pointerEvents="none">
              <line
                x1={px}
                x2={px}
                y1={box.y1}
                y2={py}
                stroke={s.stroke}
                strokeOpacity={s.opacity}
                strokeWidth={stem}
                strokeDasharray={s.dash}
                strokeLinecap="round"
              />
              <Head state={item.state} cx={px} cy={py} r={r} color={color} />
            </g>
          )
        })}

        {sel && selX !== undefined && (
          <g pointerEvents="none">
            <line
              x1={selX}
              x2={selX}
              y1={box.y0}
              y2={box.y1}
              stroke="var(--ink-2)"
              strokeWidth={1}
            />
            <circle
              cx={selX}
              cy={yScale(sel.doseMg * factor)}
              r={r + 5}
              fill="none"
              stroke="var(--ink-2)"
              strokeWidth={1.25}
            />
          </g>
        )}

        {items.length === 0 && (
          <text
            x={(box.x0 + box.x1) / 2}
            y={(box.y0 + box.y1) / 2}
            textAnchor="middle"
            fontSize={12}
            fill="var(--muted)"
          >
            {t('charts.timeline.empty')}
          </text>
        )}

        <XAxisLabels
          ticks={xTicks.ticks}
          pattern={xTicks.pattern}
          x={x}
          baselineY={box.y1}
          width={width}
          dateLocale={dfl}
        />
        <RailLabels placed={placed} labels={labels} />
      </svg>
    </div>
  )
}
