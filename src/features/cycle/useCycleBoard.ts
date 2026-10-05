import { useMemo } from 'react'
import { usePatientScope } from '@/app/scope'
import type { DoseRow, InventoryRow, SymptomRow } from '@/data/database.types'
import { useAlertDismissals, useDoses, useInventory, useProtocols, useSymptoms } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { useNow } from '@/lib/useNow'
import { attention, type CycleAttention } from './items'
import type { Item } from './queue'
import { useCycleInfos } from './useCycleInfos'

/** Nothing to ask: what a read-only view, or one still loading, shows. */
const NONE: CycleAttention = { drift: null, decision: null }
const NO_VIALS: readonly InventoryRow[] = []
const NO_DOSES: readonly DoseRow[] = []
const NO_SYMPTOMS: readonly SymptomRow[] = []

/**
 * Everything the cycle blocks of the home screen read: the cycle of each active protocol with
 * what needs attention in it, and the data behind it. The decisions and the overview sit in
 * different places of the screen and each reads its own copy; both come from the same cached
 * queries, so they always agree.
 *
 * `focusProtocolId` (the notification link `#/?cycle=<id>`) opens that protocol's decision even
 * if it was put off.
 */
export function useCycleBoard(focusProtocolId: string | null = null) {
  const { patientId, readOnly } = usePatientScope()
  const { user } = useSession()
  const uid = user?.id ?? ''
  const now = useNow()

  const protocols = useProtocols(patientId)
  const inventory = useInventory(patientId)
  const doses = useDoses(patientId, 120)
  const dismissals = useAlertDismissals(readOnly ? undefined : uid)
  const symptoms = useSymptoms(readOnly ? undefined : patientId, 90)
  const cycles = useCycleInfos(now)

  // Until the read marks and the doses are known nothing is asked: an answered decision must
  // not flash up, nor a plan announce a step the doses already took.
  const waiting = dismissals.isLoading || doses.isLoading
  const dismissed = useMemo(
    () => new Set((dismissals.data ?? []).map((d) => d.alert_key)),
    [dismissals.data],
  )
  const items: Item[] = useMemo(
    () =>
      cycles.map((c) => ({
        ...c,
        ...(readOnly || waiting
          ? NONE
          : attention(c, doses.data ?? [], dismissed, now, c.protocol.id === focusProtocolId)),
      })),
    [cycles, readOnly, waiting, doses.data, dismissed, now, focusProtocolId],
  )

  return {
    patientId,
    readOnly,
    uid,
    now,
    focusProtocolId,
    /** The protocols or the vials are still loading: nothing to show yet. */
    loading: protocols.isPending || inventory.isPending,
    items,
    vials: inventory.data ?? NO_VIALS,
    doses: doses.data ?? NO_DOSES,
    symptoms: symptoms.data ?? NO_SYMPTOMS,
  }
}

export type CycleBoard = ReturnType<typeof useCycleBoard>
