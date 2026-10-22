import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { registerMutationDefaults } from '@/data/hooks'
import { SessionProvider } from '@/features/auth/SessionProvider'
import { CACHE_BUSTER, createIdbPersister, createQueryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: ReactNode }) {
  // One client and persister per app lifetime (useState initialisers never re-run).
  // Writes paused offline resume after a reload only if their functions are known by key.
  const [client] = useState(() => {
    const qc = createQueryClient()
    registerMutationDefaults(qc)
    return qc
  })
  const [persister] = useState(() => createIdbPersister())
  const canPersist = typeof indexedDB !== 'undefined'

  const tree = (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  )

  if (!canPersist) return <QueryClientProvider client={client}>{tree}</QueryClientProvider>

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        buster: CACHE_BUSTER,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        dehydrateOptions: {
          // Never persist the clinician bundle (large, PHI-heavy) or auth-bound profile lookups by others.
          shouldDehydrateQuery: (q) =>
            q.queryKey[0] !== 'clinic_bundle' && q.state.status === 'success',
        },
      }}
      onSuccess={() => {
        void client.resumePausedMutations().then(() => client.invalidateQueries())
      }}
    >
      {tree}
    </PersistQueryClientProvider>
  )
}
