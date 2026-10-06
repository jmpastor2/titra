/**
 * What the "Futuro" screen is made of: for each active protocol, the trial-backed compound (if
 * any) with its reference band at the chosen horizon, the compounds without human outcome data,
 * and the list of things worth measuring. Pure; callers pass `now`.
 */
import { parseISO, startOfDay } from 'date-fns'
import { compoundById, compoundName } from '@/content/compounds'
import {
  outlookFor,
  type CompoundOutlook,
  type MeasureItem,
  type TrialOutlook,
} from '@/content/outlook'
import type { MeasurementKind, MeasurementRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds, toProtocolLike } from '@/data/mappers'
import type { ProtocolLike } from '@/domain/types'
import { cycleStart } from '@/features/health/progress'
import {
  asCompoundProtocol,
  bandSeries,
  referenceForHorizon,
  treatmentWeeks,
  type BandPoint,
  type Horizon,
  type HorizonReference,
} from './outlook'

export interface TrialPart {
  compoundId: string
  outlook: TrialOutlook
  like: ProtocolLike
  ref: HorizonReference
  series: BandPoint[]
  todayWeeks: number
}

export interface ProtocolOutlook {
  row: ProtocolRow
  like: ProtocolLike
  title: string
  compoundIds: string[]
  since: Date
  /** First trial-backed compound of the protocol, if any. */
  trial: TrialPart | null
  /** Every other compound, with its outlook entry when the app has one. */
  others: { compoundId: string; outlook: CompoundOutlook | undefined }[]
  measure: MeasureItem[]
}

export interface OutlookModel {
  items: ProtocolOutlook[]
  trialItems: ProtocolOutlook[]
  otherItems: ProtocolOutlook[]
  /** Start of the current cycle: the earliest active protocol. */
  cycle: Date | null
}

export function buildModel(
  protocols: readonly ProtocolRow[],
  now: Date,
  horizon: Horizon,
): OutlookModel {
  const active = protocols
    .filter((p) => p.status === 'active')
    .toSorted((a, b) => a.start_date.localeCompare(b.start_date))

  const items = active.flatMap((row): ProtocolOutlook[] => {
    const like = toProtocolLike(row)
    if (like.steps.length === 0) return []
    const compoundIds = protocolCompoundIds(row)
    const since = startOfDay(parseISO(row.start_date))
    let trial: TrialPart | null = null
    const others: ProtocolOutlook['others'] = []
    for (const id of compoundIds) {
      const outlook = outlookFor(id)
      const view: ProtocolLike | null =
        outlook?.kind === 'trial' && !trial ? asCompoundProtocol(like, id) : null
      if (outlook?.kind === 'trial' && view) {
        const ref = referenceForHorizon(view, outlook.reference, now, horizon)
        trial = {
          compoundId: id,
          outlook,
          like: view,
          ref,
          series: ref.doseMg === null ? [] : bandSeries(outlook.reference, ref.doseMg),
          todayWeeks: treatmentWeeks(view, now),
        }
      } else {
        others.push({ compoundId: id, outlook })
      }
    }
    const measure = dedupe([
      ...(trial?.outlook.measure ?? []),
      ...others.flatMap((o) => o.outlook?.measure ?? wikiMonitoring(o.compoundId)),
    ])
    const names = compoundIds.map(compoundName).join(' + ')
    const title = compoundIds.length > 1 ? row.name.trim() || names : names
    return [{ row, like, title, compoundIds, since, trial, others, measure }]
  })

  return {
    items,
    trialItems: items.filter((i) => i.trial),
    otherItems: items.filter((i) => !i.trial),
    cycle: cycleStart(active),
  }
}

function dedupe(items: readonly MeasureItem[]): MeasureItem[] {
  const seen = new Set<string>()
  return items.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
}

/** Compounds this section does not cover yet fall back to the wiki's monitoring list. */
function wikiMonitoring(compoundId: string): MeasureItem[] {
  return (compoundById(compoundId)?.monitoring ?? []).map((label, i) => ({
    id: `${compoundId}-monitoring-${i}`,
    label,
    target: { type: 'note' },
  }))
}

/* ------------------------------------------------------------------ what to measure */

/** What the person has already recorded of one thing worth measuring. */
export interface MeasureStatus {
  item: MeasureItem
  /** The measurement kind that can be counted in the app; null for labs and notes. */
  kind: MeasurementKind | null
  /** Records since the start of the cycle; null when the app cannot count them. */
  count: number | null
}

/** Every protocol's list in one, each thing once, in the order the protocols started. */
export function mergeMeasure(items: readonly ProtocolOutlook[]): MeasureItem[] {
  return dedupe(items.flatMap((i) => i.measure))
}

/** Each item with how many records of it exist from `since` on. */
export function measureStatus(
  items: readonly MeasureItem[],
  rows: readonly Pick<MeasurementRow, 'kind' | 'measured_at'>[],
  since: Date,
): MeasureStatus[] {
  const counts = new Map<MeasurementKind, number>()
  for (const r of rows) {
    if (new Date(r.measured_at) >= since) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
  }
  return items.map((item) => {
    const kind =
      item.target.type === 'measurement' || item.target.type === 'checkin' ? item.target.kind : null
    return { item, kind, count: kind ? (counts.get(kind) ?? 0) : null }
  })
}

/** How many of the things the app can count have a record, and how many there are. */
export function measureProgress(status: readonly MeasureStatus[]): { done: number; total: number } {
  const countable = status.filter((s) => s.count !== null)
  return { done: countable.filter((s) => (s.count ?? 0) > 0).length, total: countable.length }
}
