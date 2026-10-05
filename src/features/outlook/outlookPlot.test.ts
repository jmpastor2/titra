import { beforeAll, describe, expect, it } from 'vitest'
import { OUTLOOK, type TrialOutlook } from '@/content/outlook'
import { estimateTextWidth } from '@/features/exposure/chartLayout'
import i18n from '@/i18n'
import { fmtDate, fmtNumber } from '@/lib/format'
import { fmtSigned } from '@/features/health/progress'
import { bandSeries } from './outlook'
import type { Fmt } from './outlookFormat'
import {
  buildOutlookModel,
  describeStop,
  firstStopFrom,
  layoutOutlook,
  percentAxis,
  weekTicks,
  type OutlookChartData,
  type OutlookTexts,
} from './outlookPlot'

const RETA = (OUTLOOK.retatrutide as TrialOutlook).reference
const series = bandSeries(RETA, 2.5) // week 0, 24 (−7.2 to −12.9) and 48 (−8.7 to −17.1)

const data = (over: Partial<OutlookChartData> = {}): OutlookChartData => ({
  series,
  me: [],
  projection: [],
  todayWeeks: 3.2,
  targetWeeks: 30.4,
  ...over,
})

const texts: OutlookTexts = {
  today: 'hoy',
  horizon: '6 meses',
  signed: (v) => fmtSigned(v, 'es', 0),
  week: (n) => `s${n}`,
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

describe('percentAxis', () => {
  it('gives the retatrutide band whole 5-point ticks with room above zero', () => {
    const a = percentAxis([-17.1, -12.9, -8.7, -7.2, 0, -0.5, 0.6])
    expect(a).toEqual({ lo: -20, hi: 5, ticks: [-20, -15, -10, -5, 0, 5] })
  })

  it('stops the ticks at zero, with air above it, when nothing is above', () => {
    const a = percentAxis([-6, -3, 0])
    expect(a.hi).toBe(3)
    expect(a.ticks.at(-1)).toBe(0)
    expect(a.ticks[0]).toBe(a.lo)
  })

  it('counts by tens when the range is wide', () => {
    const a = percentAxis([-38, -20, 0])
    expect(a.ticks.slice(0, 3)).toEqual([-40, -30, -20])
  })

  it('has an axis even with nothing to draw, and ignores what is not a number', () => {
    expect(percentAxis([]).ticks.length).toBeGreaterThan(0)
    expect(percentAxis([Number.NaN, -10, Number.POSITIVE_INFINITY])).toEqual(percentAxis([-10]))
  })

  it('never draws a tick above 100 %', () => {
    expect(Math.max(...percentAxis([-5, 340]).ticks)).toBeLessThanOrEqual(100)
  })
})

describe('weekTicks', () => {
  it('marks every 12 weeks when they fit', () => {
    expect(weekTicks(48, 265)).toEqual([0, 12, 24, 36, 48])
    expect(weekTicks(12, 265)).toEqual([0, 12])
  })

  it('counts by 24, 48… weeks when a long protocol would crowd the labels', () => {
    const ticks = weekTicks(156, 265)
    expect(ticks.slice(0, 3)).toEqual([0, 24, 48])
    // The labels are at least a label apart.
    expect((265 * 24) / 156).toBeGreaterThan(38)
    for (const [i, t] of ticks.entries()) if (i > 0) expect(t % 12).toBe(0)
  })

  it('keeps at least the origin on a tiny plot', () => {
    expect(weekTicks(60, 20)[0]).toBe(0)
  })
})

describe('buildOutlookModel', () => {
  it('rounds the weeks up to whole blocks of 12 and keeps today and the horizon on the chart', () => {
    const m = buildOutlookModel(data())
    expect(m.maxWeek).toBe(48)
    expect(m.today).toBeCloseTo(3.2, 9)
    expect(m.horizon).toBeCloseTo(30.4, 9)
    const far = buildOutlookModel(data({ todayWeeks: 70, targetWeeks: 90 }))
    expect(far.maxWeek).toBe(96)
    // A horizon beyond the axis is pinned to its end rather than dropped.
    const tight = buildOutlookModel(
      data({ series: series.slice(0, 2), todayWeeks: 2, targetWeeks: 100 }),
    )
    expect(tight.horizon).toBeLessThanOrEqual(tight.maxWeek)
  })

  it('has no horizon line when the horizon is not ahead of today', () => {
    expect(buildOutlookModel(data({ todayWeeks: 40, targetWeeks: 40 })).horizon).toBeNull()
    expect(buildOutlookModel(data({ todayWeeks: 40, targetWeeks: 12 })).horizon).toBeNull()
  })

  it('lets the weigh-ins and the line drawn on from them widen the axis', () => {
    const m = buildOutlookModel(
      data({
        me: [
          { week: 0, pct: 0 },
          { week: 3, pct: 1.4 },
        ],
        projection: [
          { week: 3, pct: 1.4 },
          { week: 30, pct: 9 },
        ],
      }),
    )
    expect(m.yHi).toBeGreaterThanOrEqual(10)
    expect(m.yTicks.at(-1)).toBeGreaterThanOrEqual(9)
  })

  it('lists what the pointer can land on, in order of weeks: published points, weigh-ins, the end of the line', () => {
    const m = buildOutlookModel(
      data({
        me: [
          { week: 2, pct: -0.4, kg: 77.1, at: new Date(2026, 9, 1) },
          { week: 3.1, pct: -0.9 },
        ],
        projection: [
          { week: 3.1, pct: -0.9 },
          { week: 30.4, pct: -8.2 },
        ],
      }),
    )
    expect(m.stops.map((s) => [s.kind, Math.round(s.week)])).toEqual([
      ['me', 2],
      ['me', 3],
      ['trial', 24],
      ['projection', 30],
      ['trial', 48],
    ])
    // The origin of the band is not a published value, so it is not a stop.
    expect(m.stops.some((s) => s.week === 0)).toBe(false)
  })

  it('drops what is not a number and a line that is not two points', () => {
    const m = buildOutlookModel(
      data({
        me: [
          { week: Number.NaN, pct: 1 },
          { week: 1, pct: Number.NaN },
          { week: 2, pct: -1 },
        ],
        projection: [{ week: 3, pct: 0 }],
      }),
    )
    expect(m.me).toHaveLength(1)
    expect(m.projection).toEqual([])
    expect(m.stops.filter((s) => s.kind === 'projection')).toHaveLength(0)
  })

  it('starts the arrow keys at the first stop that is not behind today', () => {
    const m = buildOutlookModel(
      data({
        me: [
          { week: 1, pct: 0 },
          { week: 3, pct: -1 },
        ],
      }),
    )
    // Today is week 3.2: the first stop ahead is the 24-week time point.
    expect(m.stops[firstStopFrom(m, 3.2)]?.kind).toBe('trial')
    expect(firstStopFrom(m, 99)).toBe(m.stops.length - 1)
    expect(firstStopFrom(buildOutlookModel(data({ series: [] })), 0)).toBe(0)
  })
})

describe('layoutOutlook', () => {
  const full = data({
    me: [
      { week: 0, pct: 0 },
      { week: 3.1, pct: -0.9 },
    ],
    projection: [
      { week: 3.1, pct: -0.9 },
      { week: 30.4, pct: -8.2 },
    ],
  })

  it('maps weeks and percentages onto the plot, the ends onto the ends', () => {
    const m = buildOutlookModel(full)
    const l = layoutOutlook(m, { width: 315, height: 200, texts })
    expect(l.x(0)).toBeCloseTo(l.box.x0, 9)
    expect(l.x(m.maxWeek)).toBeCloseTo(l.box.x1, 9)
    expect(l.y(m.yLo)).toBeCloseTo(l.box.y1, 9)
    expect(l.y(m.yHi)).toBeCloseTo(l.box.y0, 9)
    expect(l.yTicks.map((t) => t.text)).toEqual(
      ['−20', '−15', '−10', '−5', '0', '+5'].slice(0, l.yTicks.length),
    )
    expect(l.xTicks.map((t) => t.text)).toEqual(['s0', 's12', 's24', 's36', 's48'])
  })

  it('puts the labels of today and the horizon above the plot without touching', () => {
    for (const width of [320, 375, 700]) {
      const m = buildOutlookModel(full)
      const l = layoutOutlook(m, { width, height: 200, texts })
      expect(l.placed.map((p) => p.key).toSorted()).toEqual(['horizon', 'today'])
      const w = (key: string) => estimateTextWidth(l.rail.get(key)?.text ?? '', 10, 6)
      for (const p of l.placed) {
        expect(p.left).toBeGreaterThanOrEqual(l.box.x0 - 1e-9)
        expect(p.left + w(p.key)).toBeLessThanOrEqual(l.box.x1 + 1e-9)
      }
      const [a, b] = l.placed
      if (a && b && a.lane === b.lane) {
        const [first, second] = a.left < b.left ? [a, b] : [b, a]
        expect(first.left + w(first.key)).toBeLessThanOrEqual(second.left)
      }
    }
  })

  it('stacks the two labels when today is close to the horizon', () => {
    const near = buildOutlookModel(data({ todayWeeks: 28, targetWeeks: 30 }))
    const l = layoutOutlook(near, { width: 320, height: 200, texts })
    expect(l.placed).toHaveLength(2)
    expect(new Set(l.placed.map((p) => p.lane)).size).toBe(2)
    // The rail makes room for both lanes.
    expect(l.box.y0).toBeGreaterThan(
      layoutOutlook(buildOutlookModel(data({ targetWeeks: 3 })), { width: 320, height: 200, texts })
        .box.y0,
    )
  })

  it('names only today when the horizon is not ahead', () => {
    const l = layoutOutlook(buildOutlookModel(data({ todayWeeks: 40, targetWeeks: 40 })), {
      width: 320,
      height: 200,
      texts,
    })
    expect(l.placed.map((p) => p.key)).toEqual(['today'])
  })

  it('writes the paths without NaN, one point per time point of the band', () => {
    const l = layoutOutlook(buildOutlookModel(full), { width: 315, height: 200, texts })
    expect(JSON.stringify(l.paths)).not.toMatch(/NaN|Infinity|undefined/)
    expect(l.paths.upper.match(/[ML]/g)).toHaveLength(series.length)
    expect(l.paths.band).toMatch(/Z$/)
    expect(l.paths.projection).toMatch(/^M[\d. -]+ L[\d. -]+$/)
    expect(
      layoutOutlook(buildOutlookModel(data()), { width: 315, height: 200, texts }).paths.projection,
    ).toBe('')
  })

  it('places the stops in order, left to right', () => {
    const l = layoutOutlook(buildOutlookModel(full), { width: 315, height: 200, texts })
    for (let i = 1; i < l.stopX.length; i++)
      expect(l.stopX[i]!).toBeGreaterThanOrEqual(l.stopX[i - 1]!)
  })

  it('draws weigh-ins that crowd together smaller, and a lone one full size', () => {
    const crowded = buildOutlookModel(
      data({
        me: Array.from({ length: 8 }, (_, i) => ({ week: i * 0.4, pct: -i * 0.1 })),
      }),
    )
    const dense = layoutOutlook(crowded, { width: 315, height: 200, texts }).meRadius
    expect(dense).toBeLessThan(4.5)
    expect(dense).toBeGreaterThanOrEqual(2.5)
    expect(
      layoutOutlook(buildOutlookModel(data({ me: [{ week: 1, pct: 0 }] })), {
        width: 315,
        height: 200,
        texts,
      }).meRadius,
    ).toBe(4.5)
  })

  it('fits a 315 px chart with room on the left for the signed labels', () => {
    const l = layoutOutlook(buildOutlookModel(full), { width: 315, height: 200, texts })
    expect(l.box.x0).toBeGreaterThan(24)
    expect(l.box.x0).toBeLessThan(40)
  })
})

describe('describeStop', () => {
  const f = {
    t: i18n.getFixedT('es'),
    locale: 'es',
    pct: (v: number, digits = 1) => `${fmtSigned(v, 'es', digits)} %`,
    weight: (kg: number) => `${fmtNumber(kg, 'es', 1)} kg`,
    range: (a: string, b: string) => (a === b ? a : `${a} a ${b}`),
    date: (d: Date) => fmtDate(d, 'es', 'd MMM yyyy'),
  } as unknown as Fmt
  const flat = (lines: string[]) => lines.map((l) => l.replace(/ /g, ' '))

  it('reads a published time point: the band and the placebo', () => {
    expect(
      flat(
        describeStop(f, {
          kind: 'trial',
          week: 24,
          lowerPct: -7.2,
          upperPct: -12.9,
          placeboPct: -1.6,
        }),
      ),
    ).toEqual(['Ensayo · semana 24', '−7,2 % a −12,9 %', 'placebo −1,6 %'])
  })

  it('reads a weigh-in with its weight and date, or just the percentage', () => {
    expect(
      flat(
        describeStop(f, { kind: 'me', week: 3.1, pct: -0.9, kg: 77.1, at: new Date(2026, 9, 1) }),
      ),
    ).toEqual(['Tu pesaje · semana 3', '−0,9 %', '77,1 kg · 1 oct 2026'])
    expect(flat(describeStop(f, { kind: 'me', week: 3.1, pct: -0.9 }))).toEqual([
      'Tu pesaje · semana 3',
      '−0,9 %',
    ])
  })

  it('says the end of the line is an extrapolation', () => {
    expect(flat(describeStop(f, { kind: 'projection', week: 30.4, pct: -8.2, kg: 71.4 }))).toEqual([
      'Tu tendencia · semana 30',
      '−8,2 %',
      'Extrapolación · ≈ 71,4 kg',
    ])
  })
})
