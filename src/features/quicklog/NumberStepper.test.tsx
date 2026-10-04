import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { NumberStepper } from './NumberStepper'
import { stepSpec } from './stepper'

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function Harness({ start = 77 as number | null, imperial = false }) {
  const [value, setValue] = useState<number | null>(start)
  return (
    <>
      <NumberStepper
        value={value}
        onChange={setValue}
        spec={stepSpec('weight', imperial)}
        unit={imperial ? 'lb' : 'kg'}
        label="Peso"
        locale="es"
      />
      <output data-testid="value">{value === null ? 'null' : String(value)}</output>
    </>
  )
}

const plus = () => screen.getByRole('button', { name: /Peso: sumar/ })
const minus = () => screen.getByRole('button', { name: /Peso: restar/ })
const field = () => screen.getByRole('textbox', { name: 'Peso' })
const value = () => screen.getByTestId('value').textContent

describe('NumberStepper', () => {
  it('shows the value with its digits and steps one tap at a time', () => {
    render(<Harness />)
    expect(field()).toHaveValue('77,0')
    fireEvent.pointerDown(plus())
    fireEvent.pointerUp(plus())
    expect(value()).toBe('77.1')
    fireEvent.pointerDown(minus())
    fireEvent.pointerUp(minus())
    fireEvent.pointerDown(minus())
    fireEvent.pointerUp(minus())
    expect(value()).toBe('76.9')
    expect(field()).toHaveValue('76,9')
  })

  it('does not step twice for one tap: the click that follows a press is ignored', () => {
    render(<Harness />)
    fireEvent.pointerDown(plus())
    fireEvent.pointerUp(plus())
    fireEvent.click(plus(), { detail: 1 })
    expect(value()).toBe('77.1')
  })

  it('steps for a keyboard activation, which has no press', () => {
    render(<Harness />)
    fireEvent.click(plus(), { detail: 0 })
    expect(value()).toBe('77.1')
  })

  it('repeats while held, gets faster, and stops on release', () => {
    render(<Harness />)
    fireEvent.pointerDown(plus())
    expect(value()).toBe('77.1')
    // Nothing before the hold delay.
    act(() => void vi.advanceTimersByTime(300))
    expect(value()).toBe('77.1')
    act(() => void vi.advanceTimersByTime(100))
    expect(value()).toBe('77.2')
    // Then every 150 ms at first.
    act(() => void vi.advanceTimersByTime(150))
    expect(value()).toBe('77.3')
    // A long hold picks up speed and takes bigger steps.
    act(() => void vi.advanceTimersByTime(4000))
    expect(Number(value())).toBeGreaterThan(80)

    fireEvent.pointerUp(plus())
    const stopped = value()
    act(() => void vi.advanceTimersByTime(2000))
    expect(value()).toBe(stopped)
  })

  it('stops when the pointer is cancelled or lost', () => {
    render(<Harness />)
    fireEvent.pointerDown(minus())
    fireEvent.pointerCancel(minus())
    act(() => void vi.advanceTimersByTime(2000))
    expect(value()).toBe('76.9')
  })

  it('lets the person type, with a comma or a point, and tidies the number when they leave', () => {
    render(<Harness />)
    fireEvent.focus(field())
    fireEvent.change(field(), { target: { value: '76,35' } })
    expect(value()).toBe('76.35')
    expect(field()).toHaveValue('76,35')
    fireEvent.blur(field())
    expect(field()).toHaveValue('76,4')
    fireEvent.change(field(), { target: { value: '80.5' } })
    expect(value()).toBe('80.5')
  })

  it('reports a half-typed number as nothing yet, and a cleared field too', () => {
    render(<Harness />)
    fireEvent.change(field(), { target: { value: '7,' } })
    expect(value()).toBe('null')
    fireEvent.change(field(), { target: { value: '' } })
    expect(value()).toBe('null')
    expect(plus()).toBeDisabled()
    expect(minus()).toBeDisabled()
  })

  it('steps with the arrow keys, ten at a time with shift', () => {
    render(<Harness />)
    fireEvent.keyDown(field(), { key: 'ArrowUp' })
    expect(value()).toBe('77.1')
    fireEvent.keyDown(field(), { key: 'ArrowDown', shiftKey: true })
    expect(value()).toBe('76.1')
  })

  it('has nothing to step from when empty, and says so with a dash', () => {
    render(<Harness start={null} />)
    expect(field()).toHaveValue('')
    expect(field()).toHaveAttribute('placeholder', '—')
    expect(plus()).toBeDisabled()
  })

  it('stops at the plausible range', () => {
    render(<Harness start={20} />)
    fireEvent.pointerDown(minus())
    fireEvent.pointerUp(minus())
    expect(value()).toBe('20')
  })

  it('steps pounds by 0.2 and names the step in the buttons', () => {
    render(<Harness start={169.8} imperial />)
    expect(screen.getByRole('button', { name: 'Peso: sumar 0,2 lb' })).toBeInTheDocument()
    fireEvent.pointerDown(plus())
    fireEvent.pointerUp(plus())
    expect(value()).toBe('170')
    expect(field()).toHaveValue('170,0')
  })
})
