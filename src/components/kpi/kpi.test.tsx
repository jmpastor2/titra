import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DayTrack, spreadClusters } from './DayTrack'
import { Delta, Kpi } from './Kpi'
import { Meter } from './Meter'
import { Spark, sparkYs } from './Spark'
import { Steps } from './Steps'
import { Ticks } from './Ticks'

const H = 3_600_000

describe('Meter', () => {
  it('fills the share of max and clamps out-of-range values', () => {
    const { container, rerender } = render(<Meter value={30} max={60} />)
    const fill = () => container.querySelector<HTMLElement>('[data-fill]')!
    expect(fill().style.width).toBe('50%')
    rerender(<Meter value={90} max={60} />)
    expect(fill().style.width).toBe('100%')
    rerender(<Meter value={Number.NaN} max={60} />)
    expect(fill().style.width).toBe('0%')
  })

  it('is decoration unless it is given a label, then it is a meter with its values', () => {
    const { container, getByRole } = render(<Meter value={96} max={100} label="Adherencia" />)
    expect(getByRole('meter', { name: 'Adherencia' }).getAttribute('aria-valuenow')).toBe('96')
    const plain = render(<Meter value={1} />)
    expect(plain.container.firstElementChild!.getAttribute('aria-hidden')).toBe('true')
    expect(container).toBeTruthy()
  })

  it('draws a target tick where the target sits', () => {
    const { container } = render(<Meter value={10} max={40} target={30} />)
    const tick = container.querySelector<HTMLElement>('span')!
    expect(tick.style.left).toBe('75%')
  })
})

describe('Ticks', () => {
  it('draws one bar per day with its state, today last', () => {
    const { container } = render(<Ticks cells={['full', 'partial', 'missed', 'none', 'rest']} />)
    const bars = [...container.querySelectorAll('[data-state]')]
    expect(bars.map((b) => b.getAttribute('data-state'))).toEqual([
      'full',
      'partial',
      'missed',
      'none',
      'rest',
    ])
    expect(bars.at(-1)!.getAttribute('data-today')).toBe('true')
  })
})

describe('Steps', () => {
  it('marks each step with its kind', () => {
    const { container } = render(
      <Steps
        steps={[{ kind: 'done' }, { kind: 'current' }, { kind: 'planned' }, { kind: 'rest' }]}
      />,
    )
    expect(
      [...container.querySelectorAll('[data-kind]')].map((s) => s.getAttribute('data-kind')),
    ).toEqual(['done', 'current', 'planned', 'rest'])
  })
})

describe('Spark', () => {
  it('keeps every point inside the box and puts higher values higher', () => {
    const ys = sparkYs([1, 2, 3])
    expect(Math.min(...ys)).toBeGreaterThan(0)
    expect(Math.max(...ys)).toBeLessThan(100)
    expect(ys[0]).toBeGreaterThan(ys[2]!)
  })

  it('a flat series sits in the middle instead of dividing by zero', () => {
    expect(sparkYs([5, 5, 5])).toEqual([50, 50, 50])
  })

  it('draws nothing with fewer than two values', () => {
    const { container } = render(<Spark values={[1]} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('DayTrack', () => {
  const now = new Date('2026-10-04T20:30:00')

  it('places the needle and the doses on a rolling window and drops what falls outside', () => {
    const { container } = render(
      <DayTrack
        now={now}
        items={[
          { at: new Date(now.getTime() + 4.5 * H), color: 'red', state: 'next' },
          { at: new Date(now.getTime() + 30 * H), color: 'red', state: 'later' },
        ]}
      />,
    )
    const markers = container.querySelectorAll('[data-state]')
    expect(markers).toHaveLength(1)
    expect(markers[0]!.getAttribute('data-state')).toBe('next')
  })

  it('labels clock ticks every six hours inside the window', () => {
    const { container } = render(<DayTrack now={now} items={[]} />)
    const labels = [...container.querySelectorAll('.readout')].map((n) => n.textContent)
    expect(labels).toEqual(['18', '00', '06', '12'])
  })

  it('fans out doses at the same time so none hides another', () => {
    const spread = spreadClusters([{ x: 50 }, { x: 50.5 }, { x: 80 }])
    expect(spread.map((s) => s.dx)).toEqual([-5.5, 5.5, 0])
  })
})

describe('Kpi and Delta', () => {
  it('reads as label, value with unit and caption', () => {
    const { container } = render(
      <Kpi
        label="Racha"
        value="8"
        unit="días"
        caption="con todas las tomas"
        aside={<Delta text="+2" direction="up" tone="good" />}
      />,
    )
    expect(container.textContent).toBe('Racha8días+2con todas las tomas')
  })
})
