/**
 * Smoke test of the whole app: every screen renders against realistic data (and against an
 * empty account) without a runtime error, a missing translation or a stray `undefined`.
 * It runs the real routes on the in-memory database of the dev lab.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { router } from '@/app/App'
import { ToastProvider } from '@/components/ui/Toast'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import { createQueryClient } from '@/lib/queryClient'
import { setSupabaseClient } from '@/lib/supabase'
import { createFakeSupabase, type Store } from './fakeSupabase'
import { buildStore, LAB_USER } from './fixtures'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, () => {}], updateServiceWorker: () => {} }),
}))

const session: SessionState = {
  status: 'signed_in',
  session: null,
  user: { id: LAB_USER.id, email: LAB_USER.email } as SessionState['user'],
}

// What jsdom lacks and the app uses.
beforeAll(() => {
  window.scrollTo = () => {}
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
})

const missing: string[] = []
const errors: string[] = []
const NOISE = [/not wrapped in act/i, /width\(0\) and height\(0\)/i, /Not implemented/i]

beforeAll(() => {
  i18n.options.saveMissing = true
  i18n.options.missingKeyHandler = (_l, _ns, key) => {
    missing.push(key)
  }
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(' ')
    if (!NOISE.some((n) => n.test(text))) errors.push(text.slice(0, 300))
  })
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterAll(() => vi.restoreAllMocks())
afterEach(() => cleanup())

function routesFor(store: Store): string[] {
  const protocol = store.protocols[0]?.id
  const base = [
    '/',
    '/log',
    '/progress',
    '/progress?tab=body',
    '/progress?tab=symptoms',
    '/progress?tab=labs',
    '/wiki',
    '/wiki/retatrutide',
    '/wiki/blend-cjc-ipamorelin',
    '/substance/retatrutide',
    '/substance/mod-grf-1-29',
    '/substance/mots-c',
    '/more',
    '/protocols',
    '/protocols/new',
    '/cycles',
    '/inventory',
    '/calculator',
    '/sites',
    '/simulator',
    '/settings',
    '/reminders',
    '/outlook',
    '/export',
    '/share',
  ]
  return protocol ? [...base, `/protocols/${protocol}`, `/protocols/${protocol}/edit`] : base
}

async function visit(route: string) {
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  const view = render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={session}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
  await act(async () => {
    await router.navigate(route)
  })
  await waitFor(
    () => {
      const main = view.container.querySelector('main')
      expect(main?.textContent?.length ?? 0).toBeGreaterThan(30)
    },
    { timeout: 8000 },
  )
  // Let queries and lazy chunks settle.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 150))
  })
  return view.container.querySelector('main')?.textContent ?? ''
}

for (const [name, empty] of [
  ['a real account', false],
  ['a new account', true],
] as const) {
  describe(`screens with ${name}`, () => {
    const store = buildStore(new Date(), { empty })
    beforeAll(() => setSupabaseClient(createFakeSupabase(store, LAB_USER)))

    for (const route of routesFor(store)) {
      it(`renders ${route}`, { timeout: 20000 }, async () => {
        missing.length = 0
        errors.length = 0
        const text = await visit(route)
        expect(text).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/)
        expect([...new Set(missing)]).toEqual([])
        expect(errors).toEqual([])
      })
    }
  })
}
