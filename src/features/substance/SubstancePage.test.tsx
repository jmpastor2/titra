import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { SubstancePage } from './SubstancePage'

// The lab account is built around the real clock, so the checks are about what is on the page,
// not about the hour it happens to be.
async function visit(compoundId: string) {
  setSupabaseClient(createFakeSupabase(buildStore(new Date()), LAB_USER))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
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
        <MemoryRouter initialEntries={[`/substance/${compoundId}`]}>
          <Routes>
            <Route path="/substance/:compoundId" element={<SubstancePage />} />
            <Route path="*" element={<div>elsewhere</div>} />
          </Routes>
        </MemoryRouter>
      </PatientScopeProvider>
    </QueryClientProvider>,
  )
  await screen.findByRole('heading', { level: 1 })
  return view
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

describe('SubstancePage', () => {
  it('draws the level curve of a long-acting substance, and the vial in use with what is left', async () => {
    await visit('retatrutide')
    expect(await screen.findByRole('img', { name: /Curva de nivel estimado/ })).toBeInTheDocument()
    const vials = screen.getByRole('heading', { name: 'Viales' }).closest('section')
    if (!vials) throw new Error('no vials section')
    expect(within(vials).getByText('En uso')).toBeInTheDocument()
    expect(within(vials).getByText(/^de \d+(,\d+)? mg$/)).toBeInTheDocument()
  })

  it('draws MOTS-c as a dose timeline instead of an empty card', async () => {
    await visit('mots-c')
    expect(await screen.findByRole('img', { name: /Línea de tomas/ })).toBeInTheDocument()
    expect(screen.getByText('Última toma')).toBeInTheDocument()
    expect(screen.getAllByText(/Sin datos farmacocinéticos en humanos/).length).toBeGreaterThan(0)
  })

  it('shows the blend as one series: its protocol name, one timeline, both compounds per dose', async () => {
    await visit('mod-grf-1-29')
    expect(
      await screen.findByRole('heading', { name: 'CJC-1295 + Ipamorelina' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Línea de tomas/ })).toBeInTheDocument()
    const recent = screen.getByText('Últimas tomas').closest('section')!
    // Each recent administration lists what went in the syringe, not just the first compound.
    expect(within(recent).getAllByText(/\d+ \+ \d+ mcg/).length).toBeGreaterThan(0)
  })

  it('sends a compound that rides in a blend to the blend instead of drawing its own level', async () => {
    await visit('ipamorelin')
    expect(
      await screen.findByRole('heading', { name: /Va dentro de «CJC-1295 \+ Ipamorelina»/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver niveles y tomas/ })).toHaveAttribute(
      'href',
      '/substance/mod-grf-1-29',
    )
    expect(screen.getByRole('link', { name: 'Ver pauta' }).getAttribute('href')).toMatch(
      /^\/protocols\//,
    )
    expect(screen.queryByRole('img', { name: /Curva de nivel|Línea de tomas/ })).toBeNull()
  })

  it('says so when the substance is not in use, instead of showing an empty chart', async () => {
    await visit('cagrilintide')
    expect(await screen.findByText('No la usas ahora')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Curva de nivel|Línea de tomas/ })).toBeNull()
  })

  it('keeps the title readable: the log button is an icon with a name', async () => {
    await visit('mod-grf-1-29')
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('button', { name: 'Registrar toma' })).toBeInTheDocument()
    expect(within(header).getByRole('heading', { level: 1 })).toHaveTextContent(
      'CJC-1295 (sin DAC)',
    )
  })

  it('holds the place of the card while the data loads', async () => {
    setSupabaseClient(createFakeSupabase(buildStore(new Date()), LAB_USER))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
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
          <MemoryRouter initialEntries={['/substance/mots-c']}>
            <Routes>
              <Route path="/substance/:compoundId" element={<SubstancePage />} />
            </Routes>
          </MemoryRouter>
        </PatientScopeProvider>
      </QueryClientProvider>,
    )
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    await screen.findByRole('img', { name: /Línea de tomas/ })
  })
})
