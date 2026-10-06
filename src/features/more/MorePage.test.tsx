import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { MorePage } from './MorePage'

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: LAB_USER.id, email: LAB_USER.email } as SessionState['user'],
}

function visit(empty = false) {
  setSupabaseClient(createFakeSupabase(buildStore(new Date(), { empty }), LAB_USER))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <PatientScopeProvider
          value={{
            patientId: LAB_USER.id,
            patient: null,
            isSelf: true,
            readOnly: false,
            canPrescribe: false,
          }}
        >
          <MemoryRouter>
            <MorePage />
          </MemoryRouter>
        </PatientScopeProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
  window.scrollTo = () => {}
})
afterEach(() => {
  cleanup()
  setSupabaseClient(null)
})

describe('MorePage', () => {
  it('groups the menu and links every row once', async () => {
    visit()
    for (const title of ['Mi pauta', 'Herramientas', 'Salud', 'App']) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument()
    }
    const plan = within(screen.getByRole('region', { name: 'Mi pauta' }))
    expect(plan.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/protocols',
      '/cycles',
      '/inventory',
    ])
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(hrefs).toContain('/settings')
    // Every row says what it is for.
    expect(screen.getByText('Reconstitución y unidades U‑100')).toBeInTheDocument()
  })

  it('shows live badges once the account has loaded', async () => {
    visit()
    expect(await screen.findByText(/activas/i)).toBeInTheDocument()
    expect(screen.getByText('Desactivados')).toBeInTheDocument()
  })

  it('stays quiet for a new account', async () => {
    visit(true)
    expect(await screen.findByText('Desactivados')).toBeInTheDocument()
    expect(screen.queryByText(/activas/i)).not.toBeInTheDocument()
  })
})
