import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: string[] = []

vi.mock('@/features/reminders/push', () => ({
  unsubscribeThisDevice: vi.fn(async () => {
    calls.push('unsubscribe')
  }),
}))
vi.mock('@/lib/queryClient', () => ({
  createIdbPersister: () => ({
    removeClient: async () => {
      calls.push('removeClient')
    },
  }),
}))
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      signOut: async () => {
        calls.push('signOut')
        return { error: null }
      },
    },
  }),
}))

const { signOut } = await import('./signOut')

beforeEach(() => {
  calls.length = 0
})

describe('signing out', () => {
  it('stops push here, forgets every cached row and the offline copy, then leaves', async () => {
    const qc = new QueryClient()
    qc.setQueryData(['doses', 'u1', 400], [{ id: 'd1' }])
    await signOut(qc)
    expect(qc.getQueryCache().getAll()).toHaveLength(0)
    expect(calls).toEqual(['unsubscribe', 'removeClient', 'signOut'])
    expect(window.location.hash).toBe('#/auth')
  })

  it('still leaves when push cannot be reached', async () => {
    const push = await import('@/features/reminders/push')
    vi.mocked(push.unsubscribeThisDevice).mockRejectedValueOnce(new Error('offline'))
    await signOut(new QueryClient())
    expect(calls).toEqual(['removeClient', 'signOut'])
  })
})
