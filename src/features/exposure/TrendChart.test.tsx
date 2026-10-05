import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { TrendChart, type TrendChartProps, type TrendPoint } from './TrendChart'
import type * as LayoutTypes from './trendLayout'
import type * as ModelTypes from './trendModel'
import * as layoutModule from './trendLayout'
import * as modelModule from './trendModel'

vi.mock('./trendLayout', async (importOriginal) => {
  const real = await importOriginal<typeof LayoutTypes>()
  return { ...real, layoutTrend: vi.fn(real.layoutTrend) }
})
vi.mock('./trendModel', async (importOriginal) => {
  const real = await importOriginal<typeof ModelTypes>()
  return { ...real, buildTrendModel: vi.fn(real.buildTrendModel) }
})

const at = (m: number, d: number, h = 8) => new Date(2026, m, d, h)
const reading = (m: number, d: number, value: number, h = 8): TrendPoint => ({
  at: at(m, d, h),
  value,
})

// Six weigh-ins from Saturday 26 Sep to Monday 5 Oct 2026.
const weights: TrendPoint[] = [
  reading(8, 26, 77.5),
  reading(8, 28, 78),
  reading(9, 1, 77.4),
  reading(9, 2, 77),
  reading(9, 3, 76.6),
  reading(9, 5, 77.2),
]

function chart(overrides: Partial<TrendChartProps> = {}) {
  return render(<TrendChart points={weights} unit="kg" {...overrides} />)
}
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
/** What the chart says about the reading under the cursor (said aloud, and drawn in the card). */
const reads = (c: HTMLElement) => c.querySelector('[aria-live]')?.textContent ?? ''
const tip = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-part="tip"]')
const choose = (c: HTMLElement, key = 'End') => fireEvent.keyDown(svgOf(c), { key })

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(() => {
  cleanup()
  vi.mocked(layoutModule.layoutTrend).mockClear()
  vi.mocked(modelModule.buildTrendModel).mockClear()
})

describe('TrendChart · what it says', () => {
  it('is an image that describes itself: how many readings, first, last and the extremes', () => {
    chart({ label: 'Peso' })
    const img = screen.getByRole('img')
    const name = (img.getAttribute('aria-label') ?? '').replace(/ /g, ' ')
    expect(name).toBe(
      'Peso. 6 registros del 26 sep 2026 al 5 oct 2026. Primero 77,5 kg, último 77,2 kg, mínimo 76,6 kg, máximo 78 kg.',
    )
  })

  it('says nothing and draws no card until a reading is chosen', () => {
    const { container } = chart()
    expect(reads(container)).toBe('')
    expect(tip(container)).toBeNull()
    expect(container.querySelector('[data-part="cursor"]')).toBeNull()
  })

  it('moves the readout with the arrow keys and lets go on Escape', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.keyDown(svg, { key: 'Home' })
    expect(reads(container)).toMatch(/26 sep/)
    expect(reads(container)).toMatch(/77,5.kg/)
    expect(container.querySelector('[data-part="cursor"]')).not.toBeNull()
    // The same words are drawn in a card beside the cursor.
    expect(tip(container)?.textContent).toMatch(/26 sep.*77,5.kg/)
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    expect(reads(container)).toMatch(/28 sep/)
    expect(reads(container)).toMatch(/78.kg/)
    fireEvent.keyDown(svg, { key: 'End' })
    expect(reads(container)).toMatch(/5 oct/)
    fireEvent.keyDown(svg, { key: 'Escape' })
    expect(container.querySelector('[data-part="cursor"]')).toBeNull()
    expect(tip(container)).toBeNull()
    expect(reads(container)).toBe('')
  })

  it('starts the arrow keys at the latest reading', () => {
    const { container } = chart()
    fireEvent.keyDown(svgOf(container), { key: 'ArrowLeft' })
    // Nothing chosen yet: the first press lands on the latest reading, from either side.
    expect(reads(container)).toMatch(/5 oct/)
    expect(container.querySelector('[data-part="cursor"]')).not.toBeNull()
  })

  it('is reachable with the keyboard', () => {
    const { container } = chart()
    expect(svgOf(container).getAttribute('tabindex')).toBe('0')
  })

  it('names the unit of a score without a space: 7/10', () => {
    const { container } = chart({ unit: '/10', digits: 0, range: [0, 10] })
    choose(container)
    expect(reads(container)).toMatch(/7\/10/)
  })

  it('shows the trend next to the reading when there is a smoothed line', () => {
    const smooth: TrendPoint[] = weights.map((p, i) => ({ at: p.at, value: 77.9 - i * 0.2 }))
    const { container } = chart({ smooth, smoothLabel: 'Tendencia' })
    // The trend is the main line; the readings are dots on a faint one.
    expect(container.querySelector('[data-part="trend"]')).not.toBeNull()
    expect(container.querySelectorAll('circle')).toHaveLength(weights.length)
    expect(svgOf(container).getAttribute('aria-label')).toMatch(/tendencia/i)
    choose(container)
    expect(reads(container)).toMatch(/Tendencia 76,9.kg/)
    expect(reads(container)).toMatch(/77,2.kg/)
    // Both are marked under the cursor: the reading and, as a ring, the trend.
    expect(container.querySelectorAll('[data-part="cursor"] circle')).toHaveLength(2)
  })

  it('shows the time when two readings share a day', () => {
    const { container } = chart({
      points: [reading(9, 5, 77.4, 8), reading(9, 5, 77, 20)],
    })
    choose(container)
    expect(reads(container)).toMatch(/20:00/)
  })
})

describe('TrendChart · with a finger', () => {
  it('keeps what was tapped until a tap somewhere else', () => {
    const { container } = chart()
    const svg = svgOf(container)
    // The plot runs from 36 px to 306 px at the width tests have; the first reading is near its left edge.
    fireEvent.pointerDown(svg, { clientX: 60, pointerType: 'touch' })
    expect(reads(container)).toMatch(/26 sep|28 sep/)
    fireEvent.pointerUp(svg, { clientX: 60, pointerType: 'touch' })
    fireEvent.pointerLeave(svg, { pointerType: 'touch' })
    expect(container.querySelector('[data-part="cursor"]')).not.toBeNull()
    fireEvent.pointerDown(document.body, { pointerType: 'touch' })
    expect(container.querySelector('[data-part="cursor"]')).toBeNull()
    expect(tip(container)).toBeNull()
  })

  it('picks the reading nearest to the finger', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.pointerDown(svg, { clientX: 300, pointerType: 'touch' })
    expect(reads(container)).toMatch(/5 oct/)
    fireEvent.pointerDown(svg, { clientX: 40, pointerType: 'touch' })
    expect(reads(container)).toMatch(/26 sep/)
  })

  it('puts the card beside the cursor, on the side that has room', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.pointerDown(svg, { clientX: 45, pointerType: 'touch' })
    // The first reading is at the left: the card goes to its right.
    expect(tip(container)?.style.left).toMatch(/px$/)
    expect(tip(container)?.style.right).toBe('')
    fireEvent.pointerDown(svg, { clientX: 300, pointerType: 'touch' })
    // The last is at the right: the card would run out of the chart, so it goes to its left.
    expect(tip(container)?.style.right).toMatch(/px$/)
    expect(tip(container)?.style.left).toBe('')
  })

  it('stacks the date, the reading and the trend in the card, or sets them in a row on a short chart', () => {
    const smooth: TrendPoint[] = weights.map((p) => ({ at: p.at, value: p.value - 0.2 }))
    const tall = chart({ smooth, smoothLabel: 'Tendencia', height: 180 })
    choose(tall.container)
    expect(tip(tall.container)?.className).toMatch(/flex-col/)
    expect(tip(tall.container)?.querySelectorAll('span')).toHaveLength(3)
    cleanup()
    const short = chart({ height: 96 })
    choose(short.container)
    expect(tip(short.container)?.className).not.toMatch(/flex-col/)
    expect(tip(short.container)?.textContent).toMatch(/5 oct.*77,2.kg/)
  })

  it('follows a mouse and lets go when it leaves', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.pointerMove(svg, { clientX: 40, pointerType: 'mouse' })
    expect(reads(container)).toMatch(/26 sep/)
    fireEvent.pointerLeave(svg, { pointerType: 'mouse' })
    expect(container.querySelector('[data-part="cursor"]')).toBeNull()
  })

  it('does not rebuild the series or the layout when only the selection moves', () => {
    const { container } = chart()
    const svg = svgOf(container)
    const builds = vi.mocked(modelModule.buildTrendModel).mock.calls.length
    const layouts = vi.mocked(layoutModule.layoutTrend).mock.calls.length
    expect(layouts).toBeGreaterThan(0)
    for (const key of ['Home', 'ArrowRight', 'ArrowRight', 'End', 'ArrowLeft', 'Escape']) {
      fireEvent.keyDown(svg, { key })
    }
    for (const x of [50, 100, 150, 200, 250]) {
      fireEvent.pointerDown(svg, { clientX: x, pointerType: 'touch' })
    }
    expect(vi.mocked(modelModule.buildTrendModel).mock.calls.length).toBe(builds)
    expect(vi.mocked(layoutModule.layoutTrend).mock.calls.length).toBe(layouts)
  })
})

describe('TrendChart · what it draws', () => {
  it('draws a dot on each reading and a line through them', () => {
    const { container } = chart()
    expect(container.querySelectorAll('circle')).toHaveLength(6)
    const line = [...container.querySelectorAll('path')].find(
      (p) => p.getAttribute('stroke-width') === '2',
    )
    expect(line?.getAttribute('d')).toMatch(/^M.* C/)
  })

  it('puts a label above each dose change that has one, and a line for all of them', () => {
    const { container } = chart({
      xDomain: [at(8, 24, 0).getTime(), at(9, 7, 0).getTime()],
      guides: [
        { at: at(9, 1, 0).getTime(), color: 'var(--sub-mint)', label: '1,25 mg' },
        { at: at(9, 4, 0).getTime(), color: 'var(--sub-violet)' },
      ],
    })
    expect(screen.getByText('1,25 mg')).toBeInTheDocument()
    const guides = [...container.querySelectorAll('line[stroke-dasharray="2 3"]')]
    expect(guides.map((g) => g.getAttribute('stroke')).toSorted()).toEqual([
      'var(--sub-mint)',
      'var(--sub-violet)',
    ])
  })

  it('shades a pause and clips it to the window', () => {
    const { container } = chart({
      xDomain: [at(8, 24, 0).getTime(), at(9, 7, 0).getTime()],
      shades: [{ from: at(8, 20).getTime(), to: at(9, 2).getTime(), color: 'var(--sub-orange)' }],
    })
    const shade = container.querySelector('rect[fill="var(--sub-orange)"]')
    expect(shade).not.toBeNull()
    expect(Number(shade?.getAttribute('x'))).toBeGreaterThanOrEqual(36 - 1e-6)
  })

  it('marks the target, named, and the reference range as a band between two limits', () => {
    const { container } = chart({ target: 72, refRange: { low: 70, high: 80 } })
    expect(container.querySelector('[data-part="target"]')).not.toBeNull()
    expect(screen.getByText('Objetivo')).toBeInTheDocument()
    const band = container.querySelector('[data-part="reference"]')!
    expect(band.querySelectorAll('line')).toHaveLength(2)
    expect(Number(band.querySelector('rect')?.getAttribute('height'))).toBeGreaterThan(10)
    expect(svgOf(container).getAttribute('aria-label')).toMatch(
      /Rango de referencia: de 70.kg a 80.kg/,
    )
  })

  it('shades only the side that is in range when the range has one limit', () => {
    const { container } = chart({
      points: weights.map((p) => ({ ...p, value: p.value / 14 })),
      refRange: { low: null, high: 5.6 },
      digits: 1,
      unit: '%',
    })
    const band = container.querySelector('[data-part="reference"]')!
    expect(band.querySelectorAll('line')).toHaveLength(1)
    const rect = band.querySelector('rect')!
    const bottomOfBand = Number(rect.getAttribute('y')) + Number(rect.getAttribute('height'))
    // From the limit down to the foot of the plot.
    const foot = Math.max(
      ...[...container.querySelectorAll('[aria-hidden] line')].map((l) =>
        Number(l.getAttribute('y1')),
      ),
    )
    expect(bottomOfBand).toBeCloseTo(foot, 0)
  })
})

describe('TrendChart · little or no data', () => {
  it('says so instead of drawing an empty frame', () => {
    const { container } = chart({ points: [] })
    expect(screen.getByText('Sin registros en este periodo')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('says so when every reading is outside the window', () => {
    const { container } = chart({ xDomain: [at(0, 1).getTime(), at(0, 20).getTime()] })
    expect(screen.getByText('Sin registros en este periodo')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('draws a lone reading as a dot with its date, and still reads it', () => {
    const { container } = chart({ points: [reading(9, 3, 77.2)] })
    expect(container.querySelectorAll('circle')).toHaveLength(1)
    expect(Number(container.querySelector('circle')?.getAttribute('r'))).toBeGreaterThan(4)
    choose(container)
    expect(reads(container)).toMatch(/3 oct.*77,2.kg/)
    expect(svgOf(container).getAttribute('aria-label')).toMatch(/1 registro: 77,2.kg el 3 oct 2026/)
    // The date is named under the dot.
    expect(screen.getAllByText('3 oct').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-part="cursor"]')).not.toBeNull()
  })

  it('draws two readings with a line between them', () => {
    const { container } = chart({ points: [reading(9, 1, 77.4), reading(9, 8, 76.1)] })
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    const d = [...container.querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '')
    expect(d.some((p) => /^M[\d. -]+ L[\d. -]+$/.test(p))).toBe(true)
  })

  it('does not divide by zero on a flat series', () => {
    const flat = Array.from({ length: 8 }, (_, i) => reading(9, 1 + i, 77.2))
    const { container } = chart({ points: flat })
    choose(container)
    expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/)
    expect(reads(container)).toMatch(/77,2.kg/)
  })

  it('never lets NaN or undefined into the page, whatever it is given', () => {
    const { container } = chart({
      points: [...weights, { at: at(9, 6), value: Number.NaN }, { at: new Date('x'), value: 3 }],
      target: Number.NaN,
      refRange: { low: Number.NaN, high: null },
      guides: [{ at: Number.NaN, color: 'red', label: 'x' }],
      shades: [{ from: Number.NaN, to: 3, color: 'red' }],
    })
    expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/)
    expect(svgOf(container).getAttribute('aria-label')).not.toMatch(/NaN|undefined/)
  })

  it('draws a year of daily readings without a dot each', () => {
    const year = Array.from({ length: 365 }, (_, i) => ({
      at: new Date(2025, 9, 6 + i, 8),
      value: 80 - i * 0.02,
    }))
    const { container } = chart({ points: year })
    expect(container.querySelectorAll('circle').length).toBe(0)
    expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/)
    expect(svgOf(container).getAttribute('aria-label')).toMatch(/365 registros/)
  })
})

describe('TrendChart · in English', () => {
  it('reads in English with a point for a decimal', async () => {
    await i18n.changeLanguage('en')
    const { container } = chart({ label: 'Weight' })
    choose(container)
    expect(reads(container)).toMatch(/77\.2.kg/)
    expect(svgOf(container).getAttribute('aria-label')).toMatch(/6 readings from 26 Sep 2026/)
    await i18n.changeLanguage('es')
  })
})
