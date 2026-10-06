import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { FastingCard } from './FastingCard'
import { setLastMeal } from './fasting'

// 23:30: the CJC + ipamorelina dose is for after midnight.
const NOW = new Date('2026-10-05T23:30:00')

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  setLastMeal(null)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const text = () => document.body.textContent ?? ''

describe('FastingCard', () => {
  it('asks when you ate, with every quick answer a full-size button', () => {
    render(<FastingCard name="CJC + Ipa" />)
    expect(text()).toContain('Ayuno para CJC + Ipa: ¿cuándo comiste?')
    for (const name of ['Acabo de comer', 'Hace 30 min', 'Hace 1 h', 'Comí a las…']) {
      expect(screen.getByRole('button', { name })).toHaveClass('h-11')
    }
    expect(screen.queryByRole('button', { name: 'Borrar' })).toBeNull()
  })

  it('counts two hours from "hace 1 h" and clears again', () => {
    render(<FastingCard name="CJC + Ipa" />)
    fireEvent.click(screen.getByRole('button', { name: 'Hace 1 h' }))
    expect(text()).toContain('Espera hasta las 00:30 · faltan 60 min')
    expect(text()).toContain('Última comida a las 22:30')
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    expect(text()).toContain('¿cuándo comiste?')
  })

  it('says you can inject once the fast is long enough', () => {
    setLastMeal(new Date('2026-10-05T21:00:00'))
    render(<FastingCard name="CJC + Ipa" />)
    expect(text()).toContain('En ayunas desde las 23:00: puedes pincharte')
  })

  it('takes a time of day and reads it as the last time it was that', () => {
    render(<FastingCard name="CJC + Ipa" />)
    fireEvent.click(screen.getByRole('button', { name: 'Comí a las…' }))
    fireEvent.change(screen.getByLabelText('Hora de la comida'), { target: { value: '21:15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(text()).toContain('Última comida a las 21:15')
    expect(text()).toContain('En ayunas desde las 23:15')
  })

  it('keeps the room of what it may show, so noting a meal moves nothing', () => {
    const { container } = render(<FastingCard name="CJC + Ipa" />)
    // The time field and "Borrar" are laid out, hidden, before they are needed.
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')]
    expect(hidden.some((e) => e.querySelector('input[type="time"]'))).toBe(true)
    expect(hidden.some((e) => e.textContent === 'Borrar')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Hace 30 min' }))
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
  })

  it('moves on as the minutes pass', () => {
    // Every timer, not only the clock: the card re-reads the time every half minute.
    vi.useRealTimers()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    setLastMeal(new Date('2026-10-05T22:00:00'))
    render(<FastingCard name="CJC + Ipa" />)
    expect(text()).toContain('faltan 30 min')
    act(() => {
      vi.advanceTimersByTime(2 * 60_000)
    })
    expect(text()).toContain('faltan 28 min')
    act(() => {
      vi.advanceTimersByTime(30 * 60_000)
    })
    expect(text()).toContain('En ayunas desde las 00:00: puedes pincharte')
  })
})
