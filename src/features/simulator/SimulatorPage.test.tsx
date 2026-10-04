import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { createFakeSupabase, type Store } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { SimulatorPage } from './SimulatorPage'

function visit(store: Store) {
  setSupabaseClient(createFakeSupabase(store, LAB_USER))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <PatientScopeProvider
        value={{
          patientId: LAB_USER.id,
          patient: null,
          isSelf: true,
          readOnly: false,
          canPrescribe: false,
        }}
      >
        <MemoryRouter initialEntries={['/simulator']}>
          <Routes>
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="*" element={<div>elsewhere</div>} />
          </Routes>
        </MemoryRouter>
      </PatientScopeProvider>
    </QueryClientProvider>,
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
  window.scrollTo = () => {}
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})
afterEach(() => {
  cleanup()
  setSupabaseClient(null)
})

describe('SimulatorPage', () => {
  it('compares skipping the next dose with the plan, in the unit the substance is dosed in', async () => {
    visit(buildStore(new Date()))
    expect(await screen.findByRole('img', { name: /Curva de nivel estimado/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Saltar una' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Nivel mínimo tras saltarla')).toBeInTheDocument()
    expect(screen.getByText(/frente a .* mg siguiendo la pauta/)).toBeInTheDocument()
    // The dose that is left out is marked on the chart and named in the legend.
    expect(screen.getByText('Toma que se salta')).toBeInTheDocument()
    expect(screen.getByText('Saltar la próxima dosis')).toBeInTheDocument()
  })

  it('only offers substances whose level is worth simulating', async () => {
    visit(buildStore(new Date()))
    await screen.findByRole('img', { name: /Curva de nivel estimado/ })
    // Retatrutide is the only long-acting one in the lab: no picker, and no short-acting pulses.
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByText('Ipamorelina')).toBeNull()
  })

  it('shows the washout when stopping', async () => {
    visit(buildStore(new Date()))
    await screen.findByRole('img', { name: /Curva de nivel estimado/ })
    fireEvent.click(screen.getByRole('tab', { name: 'Suspender' }))
    expect(screen.getByText('Lavado')).toBeInTheDocument()
    expect(screen.getByText(/Tiempo hasta caer al 10 %/)).toBeInTheDocument()
    expect(screen.queryByText('Toma que se salta')).toBeNull()
  })

  it('offers only long-acting targets when switching, never the substance itself', async () => {
    visit(buildStore(new Date()))
    await screen.findByRole('img', { name: /Curva de nivel estimado/ })
    fireEvent.click(screen.getByRole('tab', { name: 'Cambiar' }))
    const pickers = screen.getAllByRole('combobox')
    const options = within(pickers[0]!)
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(options).toContain('Tirzepatida')
    expect(options).not.toContain('Retatrutida')
    expect(options).not.toContain('Ipamorelina')
    expect(options).not.toContain('Sermorelina')
    // Switching the target keeps the page working.
    fireEvent.change(pickers[0]!, { target: { value: 'semaglutide' } })
    expect(screen.getByRole('img', { name: /Curva de nivel estimado/ })).toBeInTheDocument()
  })

  it('changes the horizon', async () => {
    visit(buildStore(new Date()))
    await screen.findByRole('img', { name: /Curva de nivel estimado/ })
    expect(screen.getAllByRole('tab', { name: /\d+ d/ }).map((t) => t.textContent)).toEqual([
      '30 d',
      '60 d',
      '90 d',
      '180 d',
    ])
    fireEvent.click(screen.getByRole('tab', { name: '180 d' }))
    expect(screen.getByRole('tab', { name: '180 d' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('img', { name: /Curva de nivel estimado/ })).toBeInTheDocument()
  })

  it('says why there is nothing to simulate with only short-acting substances', async () => {
    const store = buildStore(new Date())
    // Drop retatrutide: what is left is a 2-hour pulse and a compound with no model.
    store.protocols = store.protocols.filter((p) => p.compound_id !== 'retatrutide')
    store.doses = store.doses.filter((d) => d.compound_id !== 'retatrutide')
    visit(store)
    expect(
      await screen.findByText(/solo funciona con sustancias de acción prolongada/),
    ).toBeInTheDocument()
  })

  it('holds the shape of the page while the data loads', async () => {
    const { container } = visit(buildStore(new Date()))
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    expect(screen.getByText('Simulador')).toBeInTheDocument()
    await screen.findByRole('img', { name: /Curva de nivel estimado/ })
    expect(container.querySelectorAll('.skeleton')).toHaveLength(0)
  })

  it('asks for a protocol on a new account', async () => {
    visit(buildStore(new Date(), { empty: true }))
    expect(await screen.findByText(/Necesitas una pauta activa/)).toBeInTheDocument()
  })
})
