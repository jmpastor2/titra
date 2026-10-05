import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { describe, expect, it } from 'vitest'
import { estimateTextWidth } from './chartLayout'
import { AXIS_FONT, LANE_H } from './chartParts'
import { TREND_INSET, TREND_MARGIN } from './chartScale'
import { layoutTrend } from './trendLayout'
import { buildTrendModel, type TrendGuide, type TrendInput, type TrendPoint } from './trendModel'

const DAY = 86_400_000
const start = new Date(2026, 6, 6, 8).getTime() // Monday 6 Jul 2026, 08:00

const days = (n: number, value: (i: number) => number, every = 1): TrendPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    at: new Date(start + i * every * DAY),
    value: value(i),
  }))

function make(
  input: Partial<TrendInput> & Pick<TrendInput, 'points'>,
  { width = 375, height = 180, digits = 1 } = {},
) {
  const model = buildTrendModel(input)
  if (!model) throw new Error('no model')
  return { model, l: layoutTrend({ model, width, height, digits, locale: 'es', dateLocale: es }) }
}

const sample = days(40, (i) => 80 - i * 0.1 + Math.sin(i) * 0.4)

describe('layoutTrend · the plot box', () => {
  it('keeps the plot where the protocol strips above it expect it, at any width', () => {
    for (const width of [320, 375, 700]) {
      const { l } = make({ points: sample }, { width })
      expect(l.box.x0).toBe(TREND_INSET.left)
      expect(l.box.x1).toBe(width - TREND_INSET.right)
    }
  })

  it('makes room for a value label too wide for the usual margin', () => {
    const { l } = make({ points: days(5, (i) => 12_000 + i * 150) }, { digits: 0 })
    const widest = Math.max(
      ...l.yTicks.map((v) => estimateTextWidth(String(Math.round(v)), AXIS_FONT, 0)),
    )
    expect(l.box.x0).toBeGreaterThanOrEqual(TREND_INSET.left)
    expect(l.box.x0).toBeGreaterThanOrEqual(widest + 6)
  })

  it('maps the ends of the value axis onto the ends of the plot, readings inside', () => {
    const { l, model } = make({ points: sample })
    expect(l.y(l.yDomain[0])).toBeCloseTo(l.box.y1, 6)
    expect(l.y(l.yDomain[1])).toBeCloseTo(l.box.y0, 6)
    for (const r of model.rows) {
      expect(l.y(r.v ?? 0)).toBeGreaterThanOrEqual(l.box.y0)
      expect(l.y(r.v ?? 0)).toBeLessThanOrEqual(l.box.y1)
    }
  })

  it('draws a fixed 0 to 10 scale with a tick at each end and the middle', () => {
    const { l } = make(
      { points: days(8, (i) => 4 + (i % 5)), range: [0, 10] },
      { height: 96, digits: 0 },
    )
    expect(l.yTicks).toEqual([0, 5, 10])
    expect(l.yDomain).toEqual([0, 10])
    expect(l.box.y1 - l.box.y0).toBeGreaterThan(50)
  })

  it('takes the top margin of the old chart when no guide has a label', () => {
    const guides: TrendGuide[] = [{ at: start + 10 * DAY, color: 'red' }]
    const { l } = make({ points: sample, guides })
    expect(l.box.y0).toBe(TREND_MARGIN.top)
    expect(l.placed).toEqual([])
  })
})

describe('layoutTrend · the guide labels', () => {
  const weekly: TrendGuide[] = Array.from({ length: 12 }, (_, i) => ({
    at: start + (i + 1) * 7 * DAY - 3_600_000,
    color: 'green',
    label: `${(1 + i * 0.25).toFixed(2).replace('.', ',')} mg`,
  }))

  for (const width of [320, 375]) {
    it(`never overlaps two labels of the rail nor leaves the plot, at ${width} px`, () => {
      const points = days(90, (i) => 80 - i * 0.05)
      const { l } = make({ points, guides: weekly, xDomain: [start, start + 90 * DAY] }, { width })
      expect(l.placed.length).toBeGreaterThan(2)
      const lanes = Math.max(...l.placed.map((p) => p.lane)) + 1
      expect(lanes).toBeLessThanOrEqual(2)
      const widthOf = (key: string) => estimateTextWidth(l.rail.get(key)?.text ?? '', 10, 6)
      for (const p of l.placed) {
        expect(p.left).toBeGreaterThanOrEqual(l.box.x0 - 1e-9)
        expect(p.left + widthOf(p.key)).toBeLessThanOrEqual(l.box.x1 + 1e-9)
        for (const q of l.placed) {
          if (p === q || p.lane !== q.lane) continue
          const [a, b] = p.left < q.left ? [p, q] : [q, p]
          expect(a.left + widthOf(a.key)).toBeLessThanOrEqual(b.left)
        }
      }
      // The rail takes room from the plot, one lane at a time.
      expect(l.box.y0).toBe(6 + lanes * LANE_H + 4)
    })
  }

  it('keeps the latest dose change when there is room for only some', () => {
    const { l } = make(
      {
        points: days(90, (i) => 80 - i * 0.05),
        guides: weekly,
        xDomain: [start, start + 90 * DAY],
      },
      { width: 320 },
    )
    const kept = l.placed.map((p) => l.rail.get(p.key)?.text)
    expect(kept).toContain('3,75 mg')
  })

  it('labels two changes on the same day without sharing a key', () => {
    const at = start + 5 * DAY
    const { l } = make({
      points: sample,
      guides: [
        { at, color: 'a', label: '1 mg' },
        { at, color: 'b', label: '2 mg' },
      ],
    })
    expect(new Set(l.placed.map((p) => p.key)).size).toBe(l.placed.length)
    expect(l.rail.size).toBe(2)
  })
})

describe('layoutTrend · the time axis', () => {
  const spans = [1, 3, 7, 28, 90, 180, 365]
  for (const width of [320, 375, 700]) {
    it(`never lets two time labels touch, over any span, at ${width} px`, () => {
      for (const span of spans) {
        const points = days(Math.max(2, Math.min(span + 1, 60)), (i) => 70 + i, span / 59 || 1)
        const { l, model } = make({ points }, { width })
        const [, d1] = model.domain
        const labels = l.xTicks.map((t) => {
          const text = format(new Date(t), l.xPattern, { locale: es })
          const w = estimateTextWidth(text, AXIS_FONT, 0)
          const px = l.x(t)
          const edge =
            px < 20 ? [px, px + w] : px > width - 20 ? [px - w, px] : [px - w / 2, px + w / 2]
          return { left: edge[0]!, right: edge[1]! }
        })
        for (const [i, lab] of labels.entries()) {
          expect(lab.left, `${span} d`).toBeGreaterThanOrEqual(0)
          expect(lab.right, `${span} d`).toBeLessThanOrEqual(width)
          const prev = labels[i - 1]
          if (prev) expect(lab.left - prev.right, `${span} d`).toBeGreaterThanOrEqual(8)
        }
        expect(d1).toBeGreaterThan(0)
      }
    })
  }

  it('has labels for a normal chart, and puts the year on a long one', () => {
    expect(make({ points: days(30, (i) => i) }).l.xTicks.length).toBeGreaterThanOrEqual(2)
    const long = make({ points: days(12, (i) => i, 30) })
    expect(long.l.xPattern).toBe('MMM yy')
  })

  it('names a lone reading where it is, in the middle of the plot', () => {
    const { l, model } = make({ points: days(1, () => 77.2) })
    expect(l.xTicks).toEqual([model.rows[0]?.t])
    expect(l.xPattern).toBe('d MMM')
    const mid = (l.box.x0 + l.box.x1) / 2
    expect(l.rowX[0]).toBeCloseTo(mid, 6)
  })

  it('uses hours when the readings are hours apart', () => {
    const points: TrendPoint[] = [
      { at: new Date(2026, 9, 5, 8), value: 77.4 },
      { at: new Date(2026, 9, 5, 20), value: 77.1 },
    ]
    const { l } = make({ points })
    expect(l.xPattern).toBe('HH:mm')
    expect(l.xTicks.length).toBeGreaterThanOrEqual(2)
  })
})

describe('layoutTrend · a chart of a few readings', () => {
  it('names the day of each reading, which is what a lab result is about', () => {
    const { l, model } = make({ points: days(3, (i) => 5 + i / 10, 30) })
    expect(l.xTicks).toEqual(model.rows.map((r) => r.t))
    expect(l.xPattern).toBe('d MMM')
  })

  it('adds the year when the readings are far apart', () => {
    const { l } = make({ points: days(4, (i) => 90 + i, 120) })
    expect(l.xPattern).toBe('d MMM yy')
    expect(l.xTicks.length).toBeGreaterThanOrEqual(3)
  })

  it('does not let two names touch: the earlier one stays', () => {
    // Three readings on consecutive days and a fourth much later: the first three crowd together.
    const readings: TrendPoint[] = [0, 1, 2, 300].map((d, i) => ({
      at: new Date(start + d * DAY),
      value: 90 + i,
    }))
    const { l, model } = make({ points: readings })
    expect(l.xTicks).toHaveLength(2)
    expect(l.xTicks[0]).toBe(model.rows[0]?.t)
    expect(l.xTicks[1]).toBe(model.rows[3]?.t)
  })

  it('leaves a chart with a window of its own to the calendar', () => {
    const readings = days(3, (i) => 5 + i / 10, 30)
    const { l, model } = make({ points: readings, xDomain: [start - 5 * DAY, start + 70 * DAY] })
    expect(l.xTicks).not.toEqual(model.rows.map((r) => r.t))
  })

  it('leaves many readings to the calendar too', () => {
    const { l, model } = make({ points: days(8, (i) => i, 10) })
    expect(l.xTicks).not.toEqual(model.rows.map((r) => r.t))
  })
})

describe('layoutTrend · the target', () => {
  it('writes its name at the end of the line where the readings are not', () => {
    // Readings that finish on the target: the right end is busy, the name goes to the left.
    const closing = make({ points: days(12, (i) => 80 - i * 0.7), target: 72 }).l.target
    expect(closing?.label.anchor).toBe('start')
    expect(closing?.label.x).toBeGreaterThan(TREND_INSET.left)
    // Readings far above it all the way: the usual place, at the right.
    const far = make({ points: days(12, (i) => 90 - i * 0.1), target: 72 }).l.target
    expect(far?.label.anchor).toBe('end')
  })

  it('puts the name under the line when the line is at the very top', () => {
    const { l } = make(
      { points: days(8, (i) => 3 + i / 2), range: [0, 10], target: 10 },
      { digits: 0 },
    )
    expect(l.target?.y).toBeCloseTo(l.box.y0, 6)
    expect(l.target?.label.y).toBeGreaterThan(l.target?.y ?? 0)
  })

  it('is absent without a target', () => {
    expect(make({ points: sample }).l.target).toBeNull()
  })
})

describe('layoutTrend · packed guides', () => {
  const guides = (every: number, n: number): TrendGuide[] =>
    Array.from({ length: n }, (_, i) => ({ at: start + (i + 1) * every * DAY, color: 'red' }))

  it('fades them when they are closer than a fingertip, so they do not hatch the plot', () => {
    const win: [number, number] = [start, start + 30 * DAY]
    const points = days(10, (i) => 80 - i, 3)
    expect(make({ points, xDomain: win, guides: guides(1, 28) }).l.guideOpacity).toBeLessThan(0.5)
    expect(make({ points, xDomain: win, guides: guides(7, 4) }).l.guideOpacity).toBe(0.6)
    expect(make({ points, xDomain: win, guides: guides(7, 1) }).l.guideOpacity).toBe(0.6)
  })
})

describe('layoutTrend · paths and dots', () => {
  it('never writes NaN, whatever the shape of the series', () => {
    const shapes: Record<string, TrendPoint[]> = {
      empty: [],
      single: days(1, () => 5),
      two: days(2, (i) => 5 + i),
      flat: days(10, () => 77.2),
      zeros: days(6, () => 0),
      steep: days(10, (i) => i ** 4),
    }
    for (const [name, points] of Object.entries(shapes)) {
      if (points.length === 0) continue
      const { l } = make({ points, smooth: points })
      const text = JSON.stringify([l.paths, l.yTicks, l.xTicks, l.rowX, l.box, l.dots])
      expect(text, name).not.toMatch(/NaN|Infinity|null|undefined/)
      expect(l.rowX.every(Number.isFinite), name).toBe(true)
    }
  })

  it('keeps the readings in order from left to right', () => {
    const { l } = make({ points: sample })
    for (let i = 1; i < l.rowX.length; i++) expect(l.rowX[i]!).toBeGreaterThan(l.rowX[i - 1]!)
  })

  it('draws no line through one reading and a straight one through two', () => {
    expect(make({ points: days(1, () => 5) }).l.paths.raw).toMatch(/^M[\d. -]+$/)
    expect(make({ points: days(2, (i) => i) }).l.paths.raw).toMatch(/^M[\d. -]+ L[\d. -]+$/)
  })

  it('has a smooth path only when there is a smoothed line', () => {
    expect(make({ points: sample }).l.paths.smooth).toBe('')
    expect(make({ points: sample, smooth: sample }).l.paths.smooth).toMatch(/^M.* C/)
  })

  it('shows a dot per reading while they are apart, and none in a packed year', () => {
    const few = make({ points: days(12, (i) => i, 3) }).l.dots
    expect(few.show).toBe(true)
    expect(few.r).toBeLessThanOrEqual(3)
    const packed = make({ points: days(365, (i) => Math.sin(i / 9)) }).l.dots
    expect(packed.show).toBe(false)
    expect(make({ points: days(1, () => 5) }).l.dots).toEqual({ show: true, r: 4.5 })
  })
})
