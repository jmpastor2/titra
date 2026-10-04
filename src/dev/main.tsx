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
import { loadRealAccount } from './snapshot'

bootTheme()

/**
 * `?now=2026-10-04T20:30` makes the lab behave as if it were that moment (the clock keeps
 * ticking from there): handy for the Sunday evening before a dose step-up, the small hours
 * after a night shot, a vial about to expire…
 */
function installClock(at: string | null) {
  const target = at ? new Date(at).getTime() : Number.NaN
  if (Number.isNaN(target)) return
  const offset = target - Date.now()
  const Real = Date
  class LabDate extends Real {
    constructor(...args: [] | [number | string | Date] | number[]) {
      if (args.length === 0) super(Real.now() + offset)
      else if (args.length === 1) super(args[0] as number)
      else super(...(args as [number, number]))
    }
    static override now() {
      return Real.now() + offset
    }
  }
  globalThis.Date = LabDate as DateConstructor
}
installClock(new URLSearchParams(window.location.search).get('now'))

const params = new URLSearchParams(window.location.search)
const real = params.has('real') ? loadRealAccount() : null
if (params.has('real') && !real) document.title = 'Titra · laboratorio · sin real-snapshot.json'
const labUser = real?.user ?? LAB_USER
const store = real?.store ?? buildStore(new Date(), { empty: params.has('empty') })
setSupabaseClient(createFakeSupabase(store, labUser))

// Handy in the browser console: inspect or tweak the data, then reload the screen.
Object.assign(window, { lab: { store } })

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: labUser.id, email: labUser.email } as SessionState['user'],
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
