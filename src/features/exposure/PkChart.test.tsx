import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { DoseEvent } from '@/domain/types'
import i18n from '@/i18n'
import { estimateTextWidth } from './chartLayout'
import { buildCurveBundle } from './exposureCurves'
import { PkChart, type StepMarker } from './PkChart'
import { stepLabel } from './stepLabels'
import { labAccount } from './testData'

// Monday 5 Oct 2026, five past midnight: retatrutide steps up to 1.5 mg today.
const now = new Date(2026, 9, 5, 0, 5)
const lab = labAccount(now)
const reta = lab.byId('retatrutide')

function chart(overrides: Partial<React.ComponentProps<typeof PkChart>> = {}) {
  const b = buildCurveBundle({
    compoundId: 'retatrutide',
    pk: reta.pk!,
    history: reta.history,
    protocol: reta.protocolLike,
    daysToNextStep: reta.titration?.daysToNextStep ?? null,
    range: '4w',
    now,
  })
  const steps: StepMarker[] = b.steps.map((c) => ({
    at: c.at,
    label: stepLabel(c, 'mg', 'es', 'Pausa'),
  }))
  return render(
    <PkChart
      history={b.history}
      projection={b.projection}
      doses={reta.history}
      planned={b.planned}
      steps={steps}
      bands={b.bands}
      now={now}
      color="var(--sub-mint)"
      unit="mg"
      {...overrides}
    />,
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('PkChart', () => {
  it('reads in the unit the compound is dosed in and says what is on board now', () => {
    chart()
    expect(screen.getByText('mg')).toBeInTheDocument()
    expect(screen.getByText(/Ahora ·/)).toBeInTheDocument()
    expect(screen.getByText('0,93 mg')).toBeInTheDocument()
  })

  it('ends the solid curve exactly on the lit now point', () => {
    const { container } = chart()
    const glow = [...container.querySelectorAll('circle')].find(
      (c) => c.getAttribute('r') === '4.5',
    )!
    const point = [Number(glow.getAttribute('cx')), Number(glow.getAttribute('cy'))]
    // Paths are written to a tenth of a pixel.
    const endOf = (d: string, last: boolean) => {
      const part = last
        ? d.split(' L').at(-1)!.replace(/^M/, '')
        : d.split(' L')[0]!.replace(/^M/, '')
      return part.split(' ').map(Number)
    }
    const near = (a: number[], b: number[]) =>
      expect(Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!)).toBeLessThan(0.15)
    const solid = [...container.querySelectorAll('path')].find(
      (p) => p.getAttribute('stroke-width') === '2' && !p.getAttribute('stroke-dasharray'),
    )!
    near(endOf(solid.getAttribute('d')!, true), point)
    // The dashed projection leaves from that same point.
    const dashed = [...container.querySelectorAll('path')].find(
      (p) => p.getAttribute('stroke-dasharray') === '5 4',
    )!
    near(endOf(dashed.getAttribute('d')!, false), point)
  })

  it('never lets the step labels or the now tag overlap', () => {
    const { container } = chart()
    const rail = [...container.querySelectorAll('svg > g[aria-hidden] text')].filter(
      (t) => Number(t.getAttribute('y')) <= 40,
    )
    expect(rail.length).toBeGreaterThanOrEqual(4)
    const lanes = new Map<string, { x: number; w: number }[]>()
    for (const t of rail) {
      const y = t.getAttribute('y')!
      const entry = {
        x: Number(t.getAttribute('x')),
        w: estimateTextWidth(t.textContent ?? '', 10, 0),
      }
      lanes.set(y, [...(lanes.get(y) ?? []), entry])
    }
    for (const entries of lanes.values()) {
      const sorted = entries.toSorted((a, b) => a.x - b.x)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]!.x).toBeGreaterThanOrEqual(sorted[i - 1]!.x + sorted[i - 1]!.w - 1)
      }
    }
    // The "now" tag is among them, and the step labels keep their arrows.
    expect(screen.getByText('Ahora')).toBeInTheDocument()
    expect(screen.getByText('↑ 1,5 mg')).toBeInTheDocument()
  })

  it('draws the steady-state range of each step, the one in force a little stronger', () => {
    const { container } = chart()
    const bands = [...container.querySelectorAll('rect[fill="var(--sub-mint)"]')]
    expect(bands.length).toBeGreaterThanOrEqual(4)
    const opacities = bands.map((b) => Number(b.getAttribute('fill-opacity')))
    expect(Math.max(...opacities)).toBeGreaterThan(Math.min(...opacities))
  })

  it('still takes one steady-state range for the whole chart', () => {
    const { container } = chart({ bands: undefined, ssBand: { troughMg: 0.8, peakMg: 1.6 } })
    const bands = [...container.querySelectorAll('rect[fill="var(--sub-mint)"]')]
    expect(bands).toHaveLength(1)
    expect(Number(bands[0]!.getAttribute('fill-opacity'))).toBeGreaterThan(0.1)
  })

  it('shows the value under the finger or the arrow keys, and goes back to now', () => {
    const { container } = chart()
    const svg = container.querySelector('svg')!
    fireEvent.keyDown(svg, { key: 'End' })
    // The last sample of the projection, labelled as such.
    expect(screen.getByText(/proyección/)).toBeInTheDocument()
    fireEvent.keyDown(svg, { key: 'Home' })
    expect(screen.queryByText(/Ahora ·/)).toBeNull()
    fireEvent.keyDown(svg, { key: 'Escape' })
    expect(screen.getByText(/Ahora ·/)).toBeInTheDocument()
  })

  it('drops the selection when the range changes under it', () => {
    const b = buildCurveBundle({
      compoundId: 'retatrutide',
      pk: reta.pk!,
      history: reta.history,
      protocol: reta.protocolLike,
      daysToNextStep: null,
      range: '7d',
      now,
    })
    const { container, rerender } = chart()
    fireEvent.keyDown(container.querySelector('svg')!, { key: 'End' })
    expect(screen.queryByText(/Ahora ·/)).toBeNull()
    rerender(
      <PkChart
        history={b.history}
        projection={b.projection}
        now={now}
        color="var(--sub-mint)"
        unit="mg"
      />,
    )
    // Another range, another set of points: the old selection means nothing there.
    expect(screen.getByText(/Ahora ·/)).toBeInTheDocument()
  })

  it('starts the arrow keys at now', () => {
    const { container } = chart()
    fireEvent.keyDown(container.querySelector('svg')!, { key: 'ArrowRight' })
    // Nothing selected yet: the first press lands on the reading of this very moment.
    expect(screen.getByText('0,93 mg')).toBeInTheDocument()
    expect(screen.queryByText(/proyección/)).toBeNull()
  })

  it('reads a short-acting amount in mcg, never as 0.00 mg', () => {
    const at = (h: number) => new Date(2026, 9, 5, h)
    const doses: DoseEvent[] = [{ at: at(0), mg: 0.1 }]
    chart({
      history: [
        { at: at(0), mg: 0 },
        { at: at(1), mg: 0.08 },
        { at: now, mg: 0.05 },
      ],
      projection: [{ at: now, mg: 0.05 }],
      doses,
      planned: [],
      steps: [],
      bands: [],
      unit: 'mcg',
    })
    expect(screen.getByText('mcg')).toBeInTheDocument()
    expect(screen.getByText('50 mcg')).toBeInTheDocument()
  })

  it('draws the marks it is given instead of plain taken and planned dots', () => {
    const at = (d: number) => new Date(2026, 9, d, 9)
    const { container } = chart({
      marks: [
        { at: at(1), state: 'taken' },
        { at: at(2), state: 'late' },
        { at: at(3), state: 'extra' },
        { at: at(4), state: 'missed' },
        { at: at(8), state: 'planned' },
      ],
    })
    const states = [...container.querySelectorAll('[data-mark]')].map((m) =>
      m.getAttribute('data-mark'),
    )
    expect(states.toSorted()).toEqual(['extra', 'late', 'missed', 'planned', 'taken'])
  })

  it('marks a dose a scenario leaves out with a cross', () => {
    const skipped: DoseEvent = { at: new Date(2026, 9, 12, 9), mg: 1.5 }
    const { container } = chart({ crossed: [skipped] })
    const crosses = [...container.querySelectorAll('path')].filter((p) =>
      p.getAttribute('d')?.includes('l7 7'),
    )
    expect(crosses).toHaveLength(1)
  })

  it('renders nothing without a curve', () => {
    const { container } = chart({ history: [], projection: [] })
    expect(container.querySelector('svg')).toBeNull()
  })
})
