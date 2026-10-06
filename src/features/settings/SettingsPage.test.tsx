import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { ToastProvider } from '@/components/ui/Toast'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { SettingsPage } from './SettingsPage'

// The update card talks to the service worker, which does not exist here.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, () => {}], updateServiceWorker: () => {} }),
}))

function visit() {
  setSupabaseClient(createFakeSupabase(buildStore(new Date()), LAB_USER))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
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
          <MemoryRouter>
            <SettingsPage />
          </MemoryRouter>
        </PatientScopeProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

/** The app as the browser reports it: opened from the home screen, or from a tab. */
function runningInstalled(installed: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: installed && query.includes('standalone'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
  window.scrollTo = () => {}
})
afterEach(() => {
  cleanup()
  setSupabaseClient(null)
})

describe('SettingsPage', () => {
  it('keeps the reminders on their own screen, not repeated here', () => {
    runningInstalled(true)
    visit()
    expect(screen.queryByText(i18n.t('reminders.toggle'))).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: i18n.t('settings.profile') })).toBeInTheDocument()
  })

  it('explains how to install the app only until it is installed', () => {
    runningInstalled(false)
    visit()
    expect(screen.getByText(i18n.t('settings.installTitle'))).toBeInTheDocument()
    cleanup()

    runningInstalled(true)
    visit()
    expect(screen.queryByText(i18n.t('settings.installTitle'))).not.toBeInTheDocument()
  })
})
