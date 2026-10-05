import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import {
  buildTrendModel,
  describeTrend,
  readoutPattern,
  summarise,
  valueOf,
  withUnit,
  type TrendInput,
  type TrendPoint,
} from './trendModel'

const HOUR = 3_600_000
const DAY = 86_400_000
const at = (d: number, h = 9, m = 0) => new Date(2026, 9, d, h, m)
const pt = (d: number, value: number, h = 9): TrendPoint => ({ at: at(d, h), value })
const build = (input: Partial<TrendInput> & Pick<TrendInput, 'points'>) => buildTrendModel(input)

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

describe('buildTrendModel · the readings', () => {
  it('puts the readings in time order, one row per instant', () => {
    const m = build({ points: [pt(3, 77), pt(1, 78), pt(2, 77.5)] })!
    expect(m.rows.map((r) => r.v)).toEqual([78, 77.5, 77])
    expect(m.rows.map((r) => r.t)).toEqual([at(1).getTime(), at(2).getTime(), at(3).getTime()])
    expect(m.rawCount).toBe(3)
    expect(m.hasSmooth).toBe(false)
  })

  it('lets a later reading at the same instant replace the earlier one', () => {
    const m = build({ points: [pt(1, 78), pt(1, 79)] })!
    expect(m.rows).toHaveLength(1)
    expect(m.rows[0]?.v).toBe(79)
  })

  it('merges the smoothed line into the rows of the readings', () => {
    const m = build({
      points: [pt(1, 78), pt(2, 77)],
      smooth: [pt(1, 78), pt(2, 77.6), pt(3, 77.3)],
    })!
    expect(m.rows).toEqual([
      { t: at(1).getTime(), v: 78, s: 78 },
      { t: at(2).getTime(), v: 77, s: 77.6 },
      { t: at(3).getTime(), s: 77.3 },
    ])
    expect(m.hasSmooth).toBe(true)
    expect(m.rawCount).toBe(2)
    expect(valueOf(m.rows[2]!)).toBe(77.3)
  })

  it('drops what cannot be drawn instead of letting NaN through', () => {
    const m = build({
      points: [
        pt(1, 78),
        { at: at(2), value: Number.NaN },
        { at: new Date('nope'), value: 77 },
        { at: at(3), value: Number.POSITIVE_INFINITY },
        pt(4, 76),
      ],
    })!
    expect(m.rows.map((r) => r.v)).toEqual([78, 76])
  })

  it('has nothing to draw without readings, or with all of them outside the window', () => {
    expect(build({ points: [] })).toBeNull()
    expect(build({ points: [{ at: at(1), value: Number.NaN }] })).toBeNull()
    expect(build({ points: [pt(1, 78)], xDomain: [at(5).getTime(), at(9).getTime()] })).toBeNull()
  })
})

describe('buildTrendModel · the window', () => {
  it('uses the window it is given and only the readings inside it', () => {
    const xDomain: [number, number] = [at(2, 0).getTime(), at(6, 0).getTime()]
    const m = build({ points: [pt(1, 78), pt(3, 77), pt(5, 76), pt(7, 75)], xDomain })!
    expect(m.domain).toEqual(xDomain)
    expect(m.fixedWindow).toBe(true)
    expect(m.rows.map((r) => r.v)).toEqual([77, 76])
  })

  it('ignores a window that is not one', () => {
    const upsideDown = build({
      points: [pt(1, 78), pt(3, 77)],
      xDomain: [at(9).getTime(), at(2).getTime()],
    })!
    expect(upsideDown.fixedWindow).toBe(false)
    expect(upsideDown.rows).toHaveLength(2)
    const nan = build({ points: [pt(1, 78)], xDomain: [Number.NaN, at(2).getTime()] })!
    expect(nan.fixedWindow).toBe(false)
  })

  it('gives readings that own the chart a little room at both ends', () => {
    const m = build({ points: [pt(1, 78), pt(11, 77)] })!
    const [d0, d1] = m.domain
    expect(m.fixedWindow).toBe(false)
    expect(d0).toBeLessThan(at(1).getTime())
    expect(d1).toBeGreaterThan(at(11).getTime())
    // Five per cent of the ten days at each end.
    expect(at(1).getTime() - d0).toBeCloseTo(0.5 * DAY, -3)
  })

  it('keeps two readings a few hours apart readable', () => {
    const m = build({ points: [pt(1, 78, 8), pt(1, 77.8, 12)] })!
    const [d0, d1] = m.domain
    expect(d1 - d0).toBeGreaterThan(4 * HOUR)
    expect(d0).toBeLessThan(at(1, 8).getTime())
  })

  it('centres a lone reading in a day of its own', () => {
    const m = build({ points: [pt(3, 77.2)] })!
    const [d0, d1] = m.domain
    expect(d0).toBe(at(3).getTime() - 12 * HOUR)
    expect(d1).toBe(at(3).getTime() + 12 * HOUR)
    expect(m.rows).toHaveLength(1)
  })
})

describe('buildTrendModel · values, guides and shades', () => {
  it('spans the readings, the target and the reference range', () => {
    const m = build({
      points: [pt(1, 78), pt(2, 76)],
      target: 72,
      refRange: { low: 70, high: 80 },
    })!
    expect([m.lo, m.hi]).toEqual([70, 80])
    expect(m.target).toBe(72)
    expect(m.ref).toEqual({ low: 70, high: 80 })
  })

  it('takes a one-sided reference range and drops the missing side', () => {
    expect(build({ points: [pt(1, 5)], refRange: { low: null, high: 5.6 } })!.ref).toEqual({
      low: null,
      high: 5.6,
    })
    expect(build({ points: [pt(1, 5)], refRange: { low: undefined, high: null } })!.ref).toBeNull()
    expect(build({ points: [pt(1, 5)], refRange: { low: Number.NaN } })!.ref).toBeNull()
  })

  it('ignores a target that is not a number', () => {
    const m = build({ points: [pt(1, 78), pt(2, 76)], target: Number.NaN })!
    expect(m.target).toBeNull()
    expect([m.lo, m.hi]).toEqual([76, 78])
  })

  it('pins a fixed value range, however it comes', () => {
    expect(build({ points: [pt(1, 7)], range: [0, 10] })!.fixedRange).toEqual([0, 10])
    expect(build({ points: [pt(1, 7)], range: [10, 0] })!.fixedRange).toEqual([0, 10])
    expect(build({ points: [pt(1, 7)], range: [4, 4] })!.fixedRange).toBeNull()
    expect(build({ points: [pt(1, 7)] })!.fixedRange).toBeNull()
  })

  it('keeps the guides that are strictly inside the window, in order', () => {
    const xDomain: [number, number] = [at(1, 0).getTime(), at(10, 0).getTime()]
    const m = build({
      points: [pt(2, 1), pt(9, 2)],
      xDomain,
      guides: [
        { at: at(8).getTime(), color: 'red', label: '↑ 2 mg' },
        { at: xDomain[0], color: 'red' },
        { at: at(4).getTime(), color: 'blue' },
        { at: xDomain[1], color: 'blue' },
        { at: Number.NaN, color: 'blue' },
      ],
    })!
    expect(m.guides.map((g) => g.at)).toEqual([at(4).getTime(), at(8).getTime()])
  })

  it('clips shaded spans to the window and drops those outside it or backwards', () => {
    const xDomain: [number, number] = [at(5, 0).getTime(), at(15, 0).getTime()]
    const m = build({
      points: [pt(6, 1), pt(14, 2)],
      xDomain,
      shades: [
        { from: at(1).getTime(), to: at(7).getTime(), color: 'a' },
        { from: at(12).getTime(), to: at(20).getTime(), color: 'b' },
        { from: at(1).getTime(), to: at(3).getTime(), color: 'out' },
        { from: at(9).getTime(), to: at(8).getTime(), color: 'backwards' },
        { from: Number.NaN, to: at(8).getTime(), color: 'nan' },
      ],
    })!
    expect(m.shades.map((s) => [s.color, s.from, s.to])).toEqual([
      ['a', xDomain[0], at(7).getTime()],
      ['b', at(12).getTime(), xDomain[1]],
    ])
  })
})

describe('summarise / readoutPattern / withUnit', () => {
  it('quotes the first, last, lowest and highest reading', () => {
    const m = build({ points: [pt(1, 77.5), pt(2, 79), pt(3, 76.2)] })!
    expect(summarise(m)).toEqual({
      count: 3,
      from: at(1).getTime(),
      to: at(3).getTime(),
      first: 77.5,
      last: 76.2,
      min: 76.2,
      max: 79,
    })
  })

  it('does not count the smoothed points as readings', () => {
    const m = build({
      points: [pt(1, 77.5), pt(3, 76.2)],
      smooth: [pt(1, 77.5), pt(2, 77), pt(3, 76.8)],
    })!
    expect(summarise(m)).toMatchObject({ count: 2, first: 77.5, last: 76.2 })
  })

  it('reads a flat series as it is', () => {
    const m = build({ points: [pt(1, 5), pt(2, 5), pt(3, 5)] })!
    expect(summarise(m)).toMatchObject({ min: 5, max: 5, first: 5, last: 5 })
  })

  it('shows the weekday for weeks, the year for a long chart and the time for a shared day', () => {
    expect(readoutPattern(build({ points: [pt(1, 1), pt(9, 2)] })!)).toBe('EEE d MMM')
    const long = build({
      points: [{ at: new Date(2025, 9, 5), value: 1 }, pt(1, 2)],
    })!
    expect(readoutPattern(long)).toBe('d MMM yyyy')
    expect(readoutPattern(build({ points: [pt(1, 1, 8), pt(1, 2, 20)] })!)).toBe('EEE d MMM, HH:mm')
  })

  it('keeps a number and its unit together, and writes % and /10 as a reader expects', () => {
    expect(withUnit('77,2', 'kg', 'es')).toBe('77,2 kg')
    expect(withUnit('5,6', '%', 'es')).toBe('5,6 %')
    expect(withUnit('5.6', '%', 'en')).toBe('5.6%')
    expect(withUnit('7', '/10', 'es')).toBe('7/10')
    expect(withUnit('120', '', 'es')).toBe('120')
  })
})

describe('describeTrend', () => {
  const es = i18n.getFixedT('es')
  const en = i18n.getFixedT('en')
  const flat = (s: string) => s.replace(/ /g, ' ')
  const weights = build({ points: [pt(1, 77.5), pt(2, 79), pt(3, 76.2)] })!

  it('says what the chart shows: how many, from when, first, last and the extremes', () => {
    const text = flat(
      describeTrend({ model: weights, t: es, locale: 'es', unit: 'kg', digits: 1, label: 'Peso' }),
    )
    expect(text).toBe(
      'Peso. 3 registros del 1 oct 2026 al 3 oct 2026. Primero 77,5 kg, último 76,2 kg, mínimo 76,2 kg, máximo 79 kg.',
    )
  })

  it('has its own wording in English', () => {
    const text = flat(describeTrend({ model: weights, t: en, locale: 'en', unit: 'kg', digits: 1 }))
    expect(text).toBe(
      'Readings over time. 3 readings from 1 Oct 2026 to 3 Oct 2026. First 77.5 kg, latest 76.2 kg, lowest 76.2 kg, highest 79 kg.',
    )
  })

  it('names a single reading without a range of dates', () => {
    const one = build({ points: [pt(3, 77.2)] })!
    expect(flat(describeTrend({ model: one, t: es, locale: 'es', unit: 'kg', digits: 1 }))).toBe(
      'Evolución. 1 registro: 77,2 kg el 3 oct 2026.',
    )
  })

  it('adds the reference range, the target and the trend line when there are any', () => {
    const m = build({
      points: [pt(1, 5.1), pt(2, 5.4)],
      smooth: [pt(1, 5.1), pt(2, 5.3)],
      refRange: { low: 4, high: 5.6 },
      target: 5,
    })!
    const text = flat(describeTrend({ model: m, t: es, locale: 'es', unit: '%', digits: 1 }))
    expect(text).toContain('Rango de referencia: de 4 % a 5,6 %.')
    expect(text).toContain('Objetivo: 5 %.')
    expect(text).toContain('Incluye la línea de tendencia.')
  })

  it('words a one-sided reference range', () => {
    const only = (refRange: TrendInput['refRange']) =>
      flat(
        describeTrend({
          model: build({ points: [pt(1, 5), pt(2, 6)], refRange })!,
          t: es,
          locale: 'es',
          unit: 'mg/dL',
          digits: 0,
        }),
      )
    expect(only({ high: 100 })).toContain('Rango de referencia: hasta 100 mg/dL.')
    expect(only({ low: 70 })).toContain('Rango de referencia: desde 70 mg/dL.')
  })

  it('never lets NaN or undefined into the sentence', () => {
    const odd = build({
      points: [pt(1, 5), { at: at(2), value: Number.NaN }, pt(3, 5)],
      target: Number.NaN,
      refRange: { low: Number.NaN, high: undefined },
    })!
    const text = describeTrend({ model: odd, t: es, locale: 'es', unit: 'kg', digits: 1 })
    expect(text).not.toMatch(/NaN|undefined|null|\{\{/)
  })
})
