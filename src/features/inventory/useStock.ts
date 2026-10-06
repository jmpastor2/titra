import { useCallback, useMemo } from 'react'
import { useAlertDismissals, useDoses, useInventory, useProtocols } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { upcomingAdministrations } from '@/features/reminders/plan'
import { alertKey, splitDismissed, stockAlerts, type StockAlert } from './alerts'
import { supplyRunway } from './supply'
import { activeVial, restockPlan, vialHas, vialRunway, type VialRunway } from './vials'

const NONE: StockAlert[] = []

/**
 * Everything about stock in one place: per-vial runway, supply per substance and the
 * alerts derived from them. Shared by Today and Inventory. `alerts` leaves out the ones
 * already marked as read; those are `dismissedAlerts`, and `dismissed` tells whether a
 * given alert is one of them.
 */
export function useStock(patientId: string | undefined, now: Date = new Date()) {
  const { user } = useSession()
  const inventory = useInventory(patientId)
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const dismissals = useAlertDismissals(user?.id)
  const list = useMemo(() => inventory.data ?? [], [inventory.data])
  const day = now.toDateString()

  // Upcoming doses per compound over the next months, soonest first.
  const upcomingByCompound = useMemo(() => {
    const upcoming = upcomingAdministrations(
      protocols.data ?? [],
      doses.data ?? [],
      list,
      new Date(),
      {
        horizonDays: 240,
      },
    )
    const out = new Map<string, { at: Date; doseMg: number }[]>()
    for (const u of upcoming)
      for (const d of u.doses)
        out.set(d.compoundId, [...(out.get(d.compoundId) ?? []), { at: u.at, doseMg: d.doseMg }])
    return out
    // Recomputed once a day is enough for supply planning.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [protocols.data, doses.data, list, day])

  // For the vial each compound is drawn from: how many upcoming doses it still covers.
  // The vial in use is the one that can cover the next dose, not a nearly empty one.
  const runways = useMemo(() => {
    const out = new Map<string, VialRunway>()
    for (const compoundId of new Set(list.map((v) => v.compound_id))) {
      const mine = upcomingByCompound.get(compoundId)
      const vial = activeVial(list, compoundId, mine?.[0]?.doseMg)
      if (vial && vial.compound_id === compoundId && mine?.length)
        out.set(vial.id, vialRunway(Number(vial.remaining_mg), mine))
    }
    return out
  }, [upcomingByCompound, list])

  // The same vials walked with their discard date: how many doses each can still give
  // before it expires, and what would be thrown away.
  const usable = useMemo(() => {
    const out = new Map<string, VialRunway>()
    for (const [id, r] of runways) {
      const vial = list.find((v) => v.id === id)
      const mine = vial ? upcomingByCompound.get(vial.compound_id) : undefined
      if (vial && mine) out.set(id, { ...r, ...supplyRunway([vial], vial.compound_id, mine) })
    }
    return out
  }, [runways, list, upcomingByCompound])

  const restock = useMemo(
    () =>
      restockPlan(list, upcomingByCompound, supplyRunway).filter(
        // A blend partner is covered by the line of the vial's own compound.
        (l) =>
          !list.some(
            (v) =>
              v.compound_id !== l.compoundId &&
              vialHas(v, l.compoundId) &&
              upcomingByCompound.has(v.compound_id),
          ),
      ),
    [list, upcomingByCompound],
  )

  const all = useMemo(
    () => stockAlerts(list, restock, runways, new Date(`${day} 12:00`)),
    [list, restock, runways, day],
  )

  const dismissedKeys = useMemo(
    () => new Set((dismissals.data ?? []).map((d) => d.alert_key)),
    [dismissals.data],
  )
  const { active, read } = useMemo(() => splitDismissed(all, dismissedKeys), [all, dismissedKeys])
  const dismissed = useCallback((a: StockAlert) => dismissedKeys.has(alertKey(a)), [dismissedKeys])

  return {
    pending: inventory.isPending,
    list,
    runways,
    usable,
    restock,
    // Until the read marks have loaded nothing shows: an alert already read must not flash up.
    alerts: dismissals.isLoading ? NONE : active,
    dismissedAlerts: read,
    dismissed,
  }
}
