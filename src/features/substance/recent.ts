import type { CompoundExposure } from '@/features/exposure/useExposure'

export interface RecentAdministration {
  id: string
  at: Date
  siteId: string | null
  /** The primary compound first, then whatever went in the same syringe. */
  doses: { compoundId: string; doseMg: number }[]
}

/**
 * The latest administrations of a series, newest first. A blend is one line: what went in is
 * read off the partner rows taken at the same instant as the primary one.
 */
export function recentAdministrations(x: CompoundExposure, count: number): RecentAdministration[] {
  const partnerAt = x.partners.map((p) => ({
    compoundId: p.compoundId,
    byTime: new Map(p.doses.map((d) => [Date.parse(d.administered_at), Number(d.dose_mg)])),
  }))
  return x.doses
    .toReversed()
    .slice(0, count)
    .map((d) => {
      const at = Date.parse(d.administered_at)
      return {
        id: d.id,
        at: new Date(at),
        siteId: d.site_id,
        doses: [
          { compoundId: x.compoundId, doseMg: Number(d.dose_mg) },
          ...partnerAt.flatMap((p) => {
            const mg = p.byTime.get(at)
            return mg === undefined ? [] : [{ compoundId: p.compoundId, doseMg: mg }]
          }),
        ],
      }
    })
}
