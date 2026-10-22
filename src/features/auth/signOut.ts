import type { QueryClient } from '@tanstack/react-query'
import { unsubscribeThisDevice } from '@/features/reminders/push'
import { createIdbPersister } from '@/lib/queryClient'
import { getSupabase } from '@/lib/supabase'

/**
 * Leave the account on this device: its reminders stop arriving here, and neither the
 * cached health data nor the copy kept for offline use outlive the session.
 */
export async function signOut(qc: QueryClient): Promise<void> {
  // While still signed in: the subscription row is deleted under the user's own access.
  // Best effort, so that being offline never blocks leaving.
  await unsubscribeThisDevice().catch(() => undefined)
  await qc.cancelQueries()
  qc.clear()
  try {
    await createIdbPersister().removeClient()
  } catch {
    // Nothing stored, or storage unavailable: nothing to remove.
  }
  await getSupabase()?.auth.signOut()
  window.location.hash = '#/auth'
}
