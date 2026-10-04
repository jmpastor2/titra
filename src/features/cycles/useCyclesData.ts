/**
 * Everything the Ciclos screen shows, derived once from the protocols, the doses, the
 * weight readings and the vials: the cycles with their figures and the timeline. The
 * heavy part runs when the data changes (and once a minute for the clock), not per render.
 */
import { startOfDay, subDays } from 'date-fns'
import { useCallback, useMemo } from 'react'
import { usePatientScope } from '@/app/scope'
import type { InventoryRow } from '@/data/database.types'
import { useDoses, useInventory, useMeasurements, useProtocols } from '@/data/hooks'
import { toDoseEvent } from '@/data/mappers'
import type { DoseEvent } from '@/domain/types'
import { protocolDoseRows } from '@/features/doses/week'
import { buildCycleViews, isCurrent, isLatestOfSubstance, type CycleView } from './model'
import {
  compareCycles,
  cycleStats,
  DOSE_WINDOW_DAYS,
  weightReadings,
  type Comparison,
  type StatsInput,
  type WindowStats,
} from './stats'
import { buildTimeline, type Timeline } from './timeline'

/** How far back the weigh-ins are loaded, so an old cycle still finds its starting weight. */
const WEIGHT_WINDOW_DAYS = 730
const NO_VIALS: readonly InventoryRow[] = []

export type CycleInput = Omit<StatsInput, 'like'>

export interface CycleEntry {
  view: CycleView
  /** Null before the cycle starts, while the doses load, or if they could not be read. */
  stats: WindowStats | null
  /** Against the cycle before it, when there is one and there is enough to compare. */
  comparison: Comparison | null
  /** A new cycle can start from this one. */
  canContinue: boolean
  /** The plan ran out and nothing has taken its place: the next cycle is the next step. */
  needsNext: boolean
}

export interface CyclesData {
  /** The protocols have not arrived yet. */
  isPending: boolean
  isError: boolean
  /** Figures that depend on the doses: still loading, loaded, or failed to load. */
  statsState: 'pending' | 'ready' | 'error'
  current: CycleEntry[]
  past: CycleEntry[]
  timeline: Timeline | null
  vials: readonly InventoryRow[]
  imperial: boolean
  readOnly: boolean
  /** What a sheet needs to work out the figures of a stretch of one cycle. */
  inputOf: (view: CycleView) => CycleInput
}

export function useCyclesData(now: Date): CyclesData {
  const { patientId, patient, readOnly } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, DOSE_WINDOW_DAYS)
  const measurements = useMeasurements(patientId, WEIGHT_WINDOW_DAYS)
  const inventory = useInventory(patientId)

  const views = useMemo(() => buildCycleViews(protocols.data ?? [], now), [protocols.data, now])
  const timeline = useMemo(() => buildTimeline(views, now), [views, now])
  const readings = useMemo(() => weightReadings(measurements.data ?? []), [measurements.data])
  const histories = useMemo(
    () =>
      new Map<string, DoseEvent[]>(
        views.map((v) => [v.row.id, protocolDoseRows(v.row, doses.data ?? []).map(toDoseEvent)]),
      ),
    [views, doses.data],
  )
  const knownSince = useMemo(() => subDays(startOfDay(now), DOSE_WINDOW_DAYS), [now])
  const statsState = doses.data ? 'ready' : doses.isError ? 'error' : 'pending'

  const inputOf = useCallback(
    (view: CycleView): CycleInput => ({
      history: histories.get(view.row.id) ?? [],
      readings,
      knownSince,
    }),
    [histories, readings, knownSince],
  )

  const entries = useMemo<CycleEntry[]>(() => {
    const byId = new Map(views.map((v) => [v.row.id, v]))
    return views.map((view) => {
      const previous = view.previousId ? byId.get(view.previousId) : undefined
      const needsNext = isCurrent(view.row.status) && view.info.phase === 'finished'
      const ready = statsState === 'ready'
      return {
        view,
        stats: ready ? cycleStats(view, inputOf(view), now) : null,
        comparison:
          ready && previous
            ? compareCycles(
                view,
                previous,
                { current: inputOf(view), previous: inputOf(previous) },
                now,
              )
            : null,
        canContinue:
          !readOnly &&
          isLatestOfSubstance(view, views) &&
          (needsNext || !isCurrent(view.row.status)),
        needsNext,
      }
    })
  }, [views, inputOf, statsState, readOnly, now])

  const current = useMemo(() => entries.filter((e) => isCurrent(e.view.row.status)), [entries])
  const past = useMemo(() => entries.filter((e) => !isCurrent(e.view.row.status)), [entries])

  return {
    isPending: protocols.isPending,
    isError: protocols.isError && !protocols.data,
    statsState,
    current,
    past,
    timeline,
    vials: inventory.data ?? NO_VIALS,
    imperial: patient?.unit_system === 'imperial',
    readOnly,
    inputOf,
  }
}
