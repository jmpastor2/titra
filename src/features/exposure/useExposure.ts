/**
 * Joins protocols + doses with the PK engine. One entry per compound the user is
 * (or was recently) taking. A compound drawn into a stack or blend inherits the stack's
 * schedule with its own dose. Pure derivation, memoised.
 */
import { useMemo } from 'react'
import { compoundById } from '@/content/compounds'
import type { CompoundEntry } from '@/content/schema'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { useDoses, useProtocols } from '@/data/hooks'
import { parseComponents, protocolCompoundIds, toDoseEvent, toProtocolLike } from '@/data/mappers'
import {
  adherence,
  componentsAt,
  nextDose,
  referenceRegimen,
  titrationStatus,
  type Adherence,
  type NextDose,
  type TitrationStatus,
} from '@/domain/dosing/schedule'
import {
  amountAt,
  rateConstants,
  steadyStateProgress,
  type SteadyStateProgress,
} from '@/domain/pk/engine'
import type { DoseEvent, PkParams, ProtocolLike } from '@/domain/types'
import { hasMeaningfulCurve } from './levelSummary'

/** A compound that goes in the same syringe or blend vial as the series' primary one. */
export interface PartnerSeries {
  compoundId: string
  compound: CompoundEntry | undefined
  doses: DoseRow[]
  history: DoseEvent[]
}

export interface CompoundExposure {
  compoundId: string
  compound: CompoundEntry | undefined
  pk: PkParams | undefined
  /** The active protocol this compound is part of, as its primary or as a component. */
  protocol: ProtocolRow | null
  /** The protocol seen from this compound: its own dose on the protocol's schedule. */
  protocolLike: ProtocolLike | null
  doses: DoseRow[]
  history: DoseEvent[]
  lastDose: DoseEvent | null
  nowMg: number | null
  progress: SteadyStateProgress | null
  reference: { doseMg: number; intervalH: number } | null
  next: NextDose | null
  titration: TitrationStatus | null
  adherence: Adherence | null
  /** The instant every figure of this entry describes: the readout clock. */
  asOf: Date
  /** What to call the series: a blend's or stack's protocol name, else the compound's name. */
  title: string
  /** The other compounds of this one's blend or stack (when it is the protocol's primary). */
  partners: PartnerSeries[]
  /** The active protocol that carries this compound as a component, when it is not primary. */
  partnerOf: ProtocolRow | null
}

/**
 * Re-express a protocol for one of its compounds. A component follows the titration in
 * proportion to the primary, as the premixed vial does and as the log sheet draws it.
 */
export function protocolFor(protocol: ProtocolLike, compoundId: string): ProtocolLike {
  if (protocol.compoundId === compoundId) return protocol
  if (!protocol.components?.some((c) => c.compoundId === compoundId)) return protocol
  return {
    ...protocol,
    compoundId,
    components: [],
    steps: protocol.steps.map((s) => ({
      ...s,
      doseMg: s.pause
        ? 0
        : (componentsAt(protocol, s.doseMg).find((c) => c.compoundId === compoundId)?.doseMg ?? 0),
    })),
  }
}

interface Taken {
  rows: DoseRow[]
  history: DoseEvent[]
}

/** The doses of one compound, oldest first, with their engine events. */
function takenOf(rows: readonly DoseRow[] | undefined): Taken {
  const pairs = (rows ?? [])
    .map((row) => ({ row, event: toDoseEvent(row) }))
    .toSorted((a, b) => a.event.at.getTime() - b.event.at.getTime())
  return { rows: pairs.map((p) => p.row), history: pairs.map((p) => p.event) }
}

/**
 * Where the entries sit on Today and in lists: the compounds of an active protocol first,
 * oldest regimen first (a partner right behind its primary), then whatever else was dosed
 * recently. It depends on the plan only, never on the last dose, so a card does not jump
 * to the front every time it is logged.
 */
export function byDisplayOrder(a: CompoundExposure, b: CompoundExposure): number {
  const oa = a.partnerOf ?? a.protocol
  const ob = b.partnerOf ?? b.protocol
  if (Boolean(oa) !== Boolean(ob)) return oa ? -1 : 1
  if (!oa || !ob) {
    return (
      (b.lastDose?.at.getTime() ?? 0) - (a.lastDose?.at.getTime() ?? 0) ||
      a.compoundId.localeCompare(b.compoundId)
    )
  }
  if (oa.id === ob.id) {
    return (
      Number(Boolean(a.partnerOf)) - Number(Boolean(b.partnerOf)) ||
      a.compoundId.localeCompare(b.compoundId)
    )
  }
  return (
    oa.start_date.localeCompare(ob.start_date) ||
    oa.created_at.localeCompare(ob.created_at) ||
    Number(!hasMeaningfulCurve(a.pk)) - Number(!hasMeaningfulCurve(b.pk)) ||
    a.compoundId.localeCompare(b.compoundId)
  )
}

export function deriveExposure(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
): CompoundExposure[] {
  const active = protocols.filter((p) => p.status === 'active')
  const byCompound = new Map<string, DoseRow[]>()
  for (const d of doses) {
    const list = byCompound.get(d.compound_id)
    if (list) list.push(d)
    else byCompound.set(d.compound_id, [d])
  }
  const ids = new Set<string>([...active.flatMap(protocolCompoundIds), ...byCompound.keys()])

  const out: CompoundExposure[] = []
  for (const compoundId of ids) {
    const compound = compoundById(compoundId)
    const pk = compound?.pk
    // The protocol it leads, else the one it rides in (a compound is in one active protocol).
    const lead = active.find((p) => p.compound_id === compoundId)
    const carrier = lead
      ? undefined
      : active.find((p) => parseComponents(p.components).some((c) => c.compoundId === compoundId))
    const protocol = lead ?? carrier ?? null
    const protocolLike = protocol ? protocolFor(toProtocolLike(protocol), compoundId) : null
    const { rows: cDoses, history } = takenOf(byCompound.get(compoundId))
    // The last dose is the last one taken: a dose dated ahead is still to come.
    const lastDose = history.findLast((d) => d.at.getTime() <= now.getTime()) ?? null
    const reference = protocolLike ? referenceRegimen(protocolLike, now) : null
    const components = lead ? parseComponents(lead.components) : []

    let nowMg: number | null = null
    let progress: SteadyStateProgress | null = null
    if (pk && compound?.routes.some((r) => r === 'sc' || r === 'im')) {
      nowMg = amountAt(history, now, rateConstants(pk))
      if (reference && reference.doseMg > 0) {
        progress = steadyStateProgress(history, reference.doseMg, reference.intervalH, now, pk)
      }
    }

    out.push({
      compoundId,
      compound,
      pk,
      protocol,
      protocolLike,
      doses: cDoses,
      history,
      lastDose,
      nowMg,
      progress,
      reference,
      next: protocolLike ? nextDose(protocolLike, history, now) : null,
      titration: protocolLike ? titrationStatus(protocolLike, now) : null,
      adherence: protocolLike ? adherence(protocolLike, history, now) : null,
      asOf: now,
      title:
        lead && components.length > 0 && lead.name.trim()
          ? lead.name
          : (compound?.names.generic ?? compoundId),
      partners: components.map((c) => {
        const t = takenOf(byCompound.get(c.compoundId))
        return {
          compoundId: c.compoundId,
          compound: compoundById(c.compoundId),
          doses: t.rows,
          history: t.history,
        }
      }),
      partnerOf: carrier ?? null,
    })
  }
  return out.toSorted(byDisplayOrder)
}

const NO_PROTOCOLS: ProtocolRow[] = []
const NO_DOSES: DoseRow[] = []

/**
 * @param now the caller's clock (`useNow`). Every figure is derived at the later of it and
 * the moment the data last changed, so a dose logged a few seconds ago is never in the
 * future of the readout, however long the page has been open.
 */
export function useExposure(patientId: string | undefined, now: Date = new Date()) {
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  const minute = Math.floor(now.getTime() / 60_000) // re-derive at most once a minute…
  const changed = Math.max(protocols.dataUpdatedAt, doses.dataUpdatedAt) // …or when data lands
  const asOf = useMemo(
    () => new Date(Math.max(now.getTime(), changed)),
    // `now` itself changes identity on every render when the caller does not memoise it.
    // oxlint-disable-next-line react/exhaustive-deps
    [minute, changed],
  )
  const items = useMemo(
    () => deriveExposure(protocols.data ?? NO_PROTOCOLS, doses.data ?? NO_DOSES, asOf),
    [protocols.data, doses.data, asOf],
  )
  return {
    items,
    primary: items[0] ?? null,
    isPending: protocols.isPending || doses.isPending,
    isError: protocols.isError || doses.isError,
    protocols: protocols.data ?? NO_PROTOCOLS,
    doses: doses.data ?? NO_DOSES,
    /** The clock every entry was derived at; use it for anything drawn next to them. */
    now: asOf,
  }
}
