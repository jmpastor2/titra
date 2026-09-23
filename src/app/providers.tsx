import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { SessionProvider } from '@/features/auth/SessionProvider'
import { CACHE_BUSTER, createIdbPersister, createQueryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: ReactNode }) {
  // One client and persister per app lifetime (useState initialisers never re-run).
  const [client] = useState(createQueryClient)
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
