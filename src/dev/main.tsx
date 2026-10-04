/**
 * Development lab entry (lab.html). Runs the real routes and screens against an in-memory
 * database; nothing here is imported by the published app.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@/i18n'
import '@/styles/globals.css'
import { router } from '@/app/App'
import { ToastProvider } from '@/components/ui/Toast'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { bootTheme } from '@/lib/theme'
import { createFakeSupabase } from './fakeSupabase'
import { buildStore, LAB_USER } from './fixtures'

bootTheme()

const params = new URLSearchParams(window.location.search)
const store = buildStore(new Date(), { empty: params.has('empty') })
setSupabaseClient(createFakeSupabase(store, LAB_USER))

// Handy in the browser console: inspect or tweak the data, then reload the screen.
Object.assign(window, { lab: { store } })

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: LAB_USER.id, email: LAB_USER.email } as SessionState['user'],
}
const client = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
