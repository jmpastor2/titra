import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import { cachedCompoundDetail } from '@/content/compounds'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import { setSupabaseClient } from '@/lib/supabase'
import { CompoundPage } from './CompoundPage'

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: LAB_USER.id, email: LAB_USER.email } as SessionState['user'],
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <ToastProvider>
          <PatientScopeProvider
            value={{
              patientId: LAB_USER.id,
              patient: null,
              isSelf: true,
              readOnly: false,
              canPrescribe: false,
            }}
          >
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="/wiki" element={<p>wiki list</p>} />
                <Route path="/wiki/:compoundId" element={<CompoundPage />} />
              </Routes>
            </MemoryRouter>
          </PatientScopeProvider>
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
}

beforeAll(async () => {
  setSupabaseClient(createFakeSupabase(buildStore(new Date(), {}), LAB_USER))
  await i18n.changeLanguage('es')
})

// The detail cache lives for the whole module, so the cold start has to come first.
describe('CompoundPage', () => {
  it('shows the light header at once and the full entry once its chunk has loaded', async () => {
    expect(cachedCompoundDetail('retatrutide')).toBeUndefined()
    renderAt('/wiki/retatrutide')

    // From the light registry, before anything has loaded.
    expect(screen.getByRole('heading', { name: 'Retatrutida' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: i18n.t('common.loading') })).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('wiki.mechanism'))).not.toBeInTheDocument()

    // The long texts arrive: mechanism, trials and references.
    expect(await screen.findByText(i18n.t('wiki.mechanism'), {}, { timeout: 8000 })).toBeVisible()
    expect(screen.getByText(i18n.t('wiki.trials'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('wiki.references'))).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders the whole entry on the first paint once the chunk is in memory', () => {
    expect(cachedCompoundDetail('retatrutide')).toBeDefined()
    renderAt('/wiki/retatrutide')
    expect(screen.getByText(i18n.t('wiki.mechanism'))).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('loads a blend with its rationale, and a second entry from the same chunk', async () => {
    renderAt('/wiki/blend-cjc-ipamorelin')
    expect(await screen.findByText(i18n.t('wiki.blendWhy'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('wiki.blendMath'))).toBeInTheDocument()
  })

  it('sends an unknown id back to the wiki list without loading anything', async () => {
    renderAt('/wiki/not-a-compound')
    await waitFor(() => expect(screen.getByText('wiki list')).toBeInTheDocument())
  })
})
