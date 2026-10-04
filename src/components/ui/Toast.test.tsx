import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast, type ToastOptions } from './Toast'

function Fire({ message, options }: { message: string; options?: ToastOptions }) {
  const { toast } = useToast()
  return (
    <button type="button" onClick={() => toast(message, 'success', options)}>
      fire {message}
    </button>
  )
}

const setup = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>)
const undo = (label: string) => ({ action: { label, onAction: vi.fn() } })
const fire = (message: string) =>
  fireEvent.click(screen.getByRole('button', { name: `fire ${message}` }))
const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows a plain message and lets it go after a few seconds', () => {
    setup(<Fire message="Guardado" />)
    fire('Guardado')
    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
    wait(3300)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('runs the action once and closes without waiting for the timer', () => {
    const options = undo('Deshacer')
    setup(<Fire message="Hecho" options={options} />)
    fire('Hecho')
    expect(screen.getByRole('status')).toHaveTextContent('Hecho')
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(options.action.onAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('keeps a toast with an action longer than a plain one', () => {
    setup(<Fire message="Hecho" options={undo('Deshacer')} />)
    fire('Hecho')
    wait(5000)
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument()
    wait(3500)
    expect(screen.queryByRole('button', { name: 'Deshacer' })).toBeNull()
  })

  it('offers one way back at a time: the newest replaces the older', () => {
    const first = undo('Deshacer uno')
    const second = undo('Deshacer dos')
    setup(
      <>
        <Fire message="uno" options={first} />
        <Fire message="dos" options={second} />
      </>,
    )
    fire('uno')
    fire('dos')
    expect(screen.queryByRole('button', { name: 'Deshacer uno' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer dos' }))
    expect(second.action.onAction).toHaveBeenCalledTimes(1)
    expect(first.action.onAction).not.toHaveBeenCalled()
  })

  it('does not drop a plain message when one with an action arrives', () => {
    setup(
      <>
        <Fire message="aviso" />
        <Fire message="hecho" options={undo('Deshacer')} />
      </>,
    )
    fire('aviso')
    fire('hecho')
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })
})
