import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import type { ProfileRow } from '@/data/database.types'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { OnboardingForm } from './OnboardingPage'

function visit(onDone = vi.fn()) {
  const store = buildStore(new Date(), { empty: true })
  setSupabaseClient(createFakeSupabase(store, LAB_USER))
  const base = store.profiles[0] as unknown as ProfileRow
  const initial: ProfileRow = {
    ...base,
    display_name: 'Jose Manuel',
    birth_year: null,
    sex: null,
    height_cm: null,
    goal_weight_kg: null,
    onboarded: false,
  }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <OnboardingForm userId={LAB_USER.id} initial={initial} onDone={onDone} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { onDone, store }
}

beforeEach(() => i18n.changeLanguage('es'))
afterEach(() => {
  cleanup()
  setSupabaseClient(null)
})

describe('OnboardingForm', () => {
  it('switches the screen to the chosen language at once', async () => {
    visit()
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'English' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome' })).toBeInTheDocument()
  })

  it('keeps the goal in the unit chosen and refuses one it cannot read', async () => {
    const { onDone } = visit()
    fireEvent.click(screen.getByRole('tab', { name: 'Imperial (lb, in)' }))
    expect(screen.getByText('lb')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Peso objetivo'), { target: { value: 'mucho' } })
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa el número')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('saves the profile as set up and moves on', async () => {
    const { onDone, store } = visit()
    fireEvent.click(screen.getByRole('tab', { name: 'Hombre' }))
    fireEvent.change(screen.getByLabelText('Peso objetivo'), { target: { value: '72' } })
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(store.profiles[0]).toMatchObject({ sex: 'M', goal_weight_kg: 72, onboarded: true })
  })
})
