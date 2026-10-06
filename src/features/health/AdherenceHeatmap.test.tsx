import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { AdherenceHeatmap } from './AdherenceHeatmap'
import type { AdherenceDay } from './consistency'
import { heatGrid } from './heatmap'

const now = new Date(2026, 9, 7, 14) // Wednesday 7 Oct 2026

function day(d: Date, taken: number, expected: number): AdherenceDay {
  return {
    day: d,
    taken,
    expected,
    ratio: expected > 0 ? taken / expected : null,
    mark: expected === 0 ? 'none' : taken >= expected ? 'full' : taken === 0 ? 'missed' : 'partial',
  }
}

const grid = heatGrid(
  [
    day(new Date(2026, 9, 5), 2, 2), // Mon: everything
    day(new Date(2026, 9, 6), 1, 2), // Tue: half
    day(new Date(2026, 9, 7), 0, 1), // Wed (today): none
    day(new Date(2026, 8, 28), 1, 3), // a week earlier, Mon: a third
  ],
  now,
)

const grain = (c: HTMLElement) => c.querySelector('[role="img"]') as HTMLElement
const readout = (c: HTMLElement) => c.querySelector('[aria-live]')?.textContent ?? ''
const flat = (s: string) => s.replace(/[  ]/g, ' ')

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('AdherenceHeatmap', () => {
  it('draws twelve weeks of seven days, each tinted by what was taken', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    const cells = [...container.querySelectorAll('[data-level]')]
    expect(cells).toHaveLength(84)
    const count = (level: string) =>
      cells.filter((c) => c.getAttribute('data-level') === level).length
    expect(count('full')).toBe(1)
    expect(count('mid')).toBe(1)
    expect(count('low')).toBe(1)
    expect(count('missed')).toBe(1)
    // The four days of this week that have not come yet.
    expect(count('future')).toBe(4)
  })

  it('describes itself in a sentence, with the days of each kind', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    expect(grain(container).getAttribute('aria-label')).toBe(
      'Calendario de 12 semanas. 1 días con todas las tomas, 2 con algunas y 1 sin ninguna.',
    )
  })

  it('names the weekdays from Monday and the months where they change', () => {
    render(<AdherenceHeatmap grid={grid} />)
    for (const month of ['jul', 'ago', 'sep', 'oct']) {
      expect(screen.getByText(new RegExp(`^${month}`, 'i'))).toBeInTheDocument()
    }
    expect(screen.getByText('X')).toBeInTheDocument()
  })

  it('has a legend and a hint about what to do until something is chosen', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    expect(screen.getByText('Todas las tomas')).toBeInTheDocument()
    expect(screen.getByText('Sin tomas')).toBeInTheDocument()
    expect(screen.getByText(/Toca un día/)).toBeInTheDocument()
    expect(readout(container)).toBe('')
  })

  it('reads the day the arrow keys land on: today first, then its neighbours', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    const frame = grain(container)
    fireEvent.keyDown(frame, { key: 'ArrowRight' })
    expect(flat(readout(container))).toBe('mié 7 oct · 0 de 1 tomas')
    fireEvent.keyDown(frame, { key: 'ArrowUp' })
    expect(flat(readout(container))).toBe('mar 6 oct · 1 de 2 tomas')
    fireEvent.keyDown(frame, { key: 'ArrowUp' })
    expect(flat(readout(container))).toBe('lun 5 oct · 2 de 2 tomas')
    fireEvent.keyDown(frame, { key: 'ArrowLeft' })
    expect(flat(readout(container))).toBe('lun 28 sep · 1 de 3 tomas')
    fireEvent.keyDown(frame, { key: 'ArrowDown' })
    expect(flat(readout(container))).toBe('mar 29 sep · sin tomas previstas')
    fireEvent.keyDown(frame, { key: 'Escape' })
    expect(readout(container)).toBe('')
  })

  it('says a day that has not come yet is just that', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    const frame = grain(container)
    fireEvent.keyDown(frame, { key: 'ArrowRight' })
    fireEvent.keyDown(frame, { key: 'ArrowDown' })
    expect(flat(readout(container))).toBe('jue 8 oct · todavía no')
  })

  it('stays inside the grid at its edges', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    const frame = grain(container)
    fireEvent.keyDown(frame, { key: 'ArrowRight' })
    for (let i = 0; i < 12; i++) fireEvent.keyDown(frame, { key: 'ArrowRight' })
    expect(flat(readout(container))).toBe('mié 7 oct · 0 de 1 tomas')
    for (let i = 0; i < 20; i++) fireEvent.keyDown(frame, { key: 'ArrowLeft' })
    expect(flat(readout(container))).toMatch(/^mié 22 jul/)
  })

  it('picks the day under a tap and keeps it until a tap somewhere else', () => {
    const { container } = render(<AdherenceHeatmap grid={grid} />)
    const frame = grain(container)
    // A 240 x 140 box: each of the 12 columns is 20 px wide and each of the 7 rows 20 px tall.
    frame.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 240, bottom: 140, width: 240, height: 140, x: 0, y: 0 }) as DOMRect
    // Last column (this week), first row (Monday).
    fireEvent.pointerDown(frame, { clientX: 235, clientY: 5, pointerType: 'touch' })
    expect(flat(readout(container))).toBe('lun 5 oct · 2 de 2 tomas')
    fireEvent.pointerDown(document.body, { pointerType: 'touch' })
    expect(readout(container)).toBe('')
  })
})
