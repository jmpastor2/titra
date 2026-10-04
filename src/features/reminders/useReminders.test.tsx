import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { createFakeSupabase, type Row, type Store } from '@/dev/fakeSupabase'
import { FixedSessionProvider, type SessionState } from '@/features/auth/SessionProvider'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { ReminderAgent } from './useReminders'

const W15 = [1, 2, 3, 4, 5]
const step = (doseMg: number, durationWeeks: number) => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
// 6 → 9 → 12 U of the CJC-1295 + ipamorelin blend; the step to 12 U begins on Monday Oct 5.
const CJC: Row = {
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '01:00',
  times: ['25:00'],
  steps: [step(0.1, 1), step(0.15, 1), step(0.2, 10)],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '2026-09-21T10:00:00Z',
  updated_at: '2026-09-21T10:00:00Z',
}
const BLEND: Row = {
  id: 'blend',
  patient_id: 'u',
  compound_id: 'mod-grf-1-29',
  form: 'vial',
  label: 'CJC + Ipa',
  total_mg: 5,
  remaining_mg: 5,
  concentration_mg_per_ml: 5 / 3,
  diluent_ml: 3,
  components: [{ compoundId: 'ipamorelin', mg: 5 }],
  opened_at: '2026-09-21',
  expires_at: null,
  lot: null,
  storage_notes: null,
  archived: false,
  created_at: '2026-09-21T10:00:00Z',
  updated_at: '2026-09-21T10:00:00Z',
}
const PROFILE: Row = {
  id: 'u',
  role: 'patient',
  display_name: 'Lab',
  locale: 'es',
  reminders_enabled: true,
  reminder_lead_minutes: 0,
}
const SESSION = { status: 'signed_in', session: null, user: { id: 'u' } } as SessionState

function renderAgent(dismissals: Row[] = []) {
  const store: Store = {
    profiles: [PROFILE],
    protocols: [CJC],
    inventory: [BLEND],
    doses: [],
    measurements: [],
    saved_protocols: [],
    alert_dismissals: dismissals,
  }
  setSupabaseClient(createFakeSupabase(store, { id: 'u', email: 'u@titra.test' }))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <FixedSessionProvider value={SESSION}>
        <ToastProvider>
          <ReminderAgent />
        </ToastProvider>
      </FixedSessionProvider>
    </QueryClientProvider>,
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

beforeEach(() => {
  // Ten seconds before 20:00 on the Sunday before the step-up. Time is driven by hand.
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-04T19:59:50'))
  sessionStorage.clear()
})

/** Let the data load and the clock run `seconds` forward. */
const run = (seconds: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000)
  })

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  setSupabaseClient(null)
})

describe('ReminderAgent · decisions', () => {
  it('asks in the app at 20:00 the evening before a step-up', async () => {
    renderAgent()
    await run(9)
    expect(screen.queryByText(/Mañana sube la dosis/)).toBeNull()
    await run(2)
    const toast = screen.getByText(/Mañana sube la dosis ·/)
    expect(toast).toHaveTextContent(
      'CJC-1295 + Ipamorelina: de 9 U (150 mcg) a 12 U (200 mcg). ¿Subes o mantienes una semana más?',
    )
  })

  it('does not ask again about a decision that was already answered', async () => {
    renderAgent([{ id: 'd1', user_id: 'u', alert_key: 'step:cjc:2', created_at: '2026-10-04' }])
    await run(11) // past 20:00 with the data loaded: nothing to say
    expect(screen.queryByText(/Mañana sube la dosis/)).toBeNull()
  })
})
