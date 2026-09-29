import { useMemo } from 'react'
import { useDoses, useInventory, useProtocols } from '@/data/hooks'
import { upcomingAdministrations } from '@/features/reminders/plan'
import { stockAlerts } from './alerts'
import { activeVial, restockPlan, vialHas, vialRunway, type VialRunway } from './vials'

/**
 * Everything about stock in one place: per-vial runway, supply per substance and the
 * alerts derived from them. Shared by Today and Inventory.
 */
export function useStock(patientId: string | undefined, now: Date = new Date()) {
  const inventory = useInventory(patientId)
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
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
  const runways = useMemo(() => {
    const out = new Map<string, VialRunway>()
    for (const compoundId of new Set(list.map((v) => v.compound_id))) {
      const vial = activeVial(list, compoundId)
      const mine = upcomingByCompound.get(compoundId)
      if (vial && vial.compound_id === compoundId && mine?.length)
        out.set(vial.id, vialRunway(Number(vial.remaining_mg), mine))
    }
    return out
  }, [upcomingByCompound, list])

  const restock = useMemo(
    () =>
      restockPlan(list, upcomingByCompound).filter(
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

  const alerts = useMemo(
    () => stockAlerts(list, restock, runways, new Date(`${day} 12:00`)),
    [list, restock, runways, day],
  )

  return { pending: inventory.isPending, list, runways, restock, alerts }
}
