import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { t } from 'i18next'
import { planDraw } from '@/domain/dosing/draw'
import { InjectedCover } from './InjectedCover'

const plan = planDraw([{ compoundId: 'mots-c', doseMg: 1.5, concMgPerMl: 10 }])!

afterEach(() => {
  vi.useRealTimers()
})

describe('InjectedCover', () => {
  it('says the dose is logged and closes by itself', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<InjectedCover plan={plan} onDone={onDone} />)
    expect(screen.getByRole('status')).toHaveTextContent(t('doses.logged'))
    act(() => {
      vi.advanceTimersByTime(1400)
    })
    expect(onDone).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('closes at once on a tap', () => {
    const onDone = vi.fn()
    render(<InjectedCover plan={plan} onDone={onDone} />)
    fireEvent.click(screen.getByRole('status'))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
