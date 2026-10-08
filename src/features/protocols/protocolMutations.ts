import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProtocolRow } from '@/data/database.types'
import { qk } from '@/data/hooks'
import { requireSupabase } from '@/lib/supabase'

/** The fields a card or a sheet changes without rewriting the whole protocol. */
export type ProtocolPatch = Partial<
  Pick<ProtocolRow, 'steps' | 'components' | 'status' | 'times' | 'time_of_day'>
>

/**
 * Change some fields of one protocol (its steps after "keep this week", its status…).
 * `useSaveProtocol` takes a whole row; this one takes only what changes, so undoing is
 * writing the previous values back.
 */
export function useUpdateProtocol(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProtocolPatch }) => {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('protocols')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.protocols(patientId) }),
  })
}
