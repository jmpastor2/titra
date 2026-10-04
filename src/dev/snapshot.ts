/**
 * Development lab only: `lab.html?real=1` runs the app on a copy of a real account instead of
 * the made-up one. The copy lives in `real-snapshot.json` next to this file (ignored by git;
 * export it with the Supabase CLI) and everything the app writes stays in memory.
 */
import type { Row, Store } from './fakeSupabase'

type Snapshot = Partial<Record<string, Row[]>>

export interface RealAccount {
  store: Store
  user: { id: string; email: string }
}

export function loadRealAccount(): RealAccount | null {
  const files = import.meta.glob<Snapshot>('./real-snapshot.json', {
    eager: true,
    import: 'default',
  })
  const snapshot = Object.values(files)[0]
  if (!snapshot) return null

  const owner = String(snapshot.protocols?.[0]?.patient_id ?? snapshot.profiles?.[0]?.id ?? '')
  if (!owner) return null
  const of = (table: string) => snapshot[table] ?? []
  const store: Store = {
    profiles: of('profiles').filter((p) => p.id === owner),
    protocols: of('protocols'),
    inventory: of('inventory'),
    doses: of('doses'),
    measurements: of('measurements'),
    symptoms: of('symptoms'),
    lab_results: of('lab_results'),
    saved_protocols: of('saved_protocols'),
    alert_dismissals: of('alert_dismissals'),
    care_links: [],
    clinical_notes: [],
    compound_notes: [],
    push_subscriptions: [],
    reminders: [],
  }
  return { store, user: { id: owner, email: 'real@titra.test' } }
}
