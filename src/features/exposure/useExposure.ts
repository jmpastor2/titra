/**
 * Joins protocols + doses with the PK engine. One entry per compound the user is
 * (or was recently) taking. A compound drawn into a stack inherits the stack's
 * schedule with its own dose. Pure derivation, memoised.
 */
import { useMemo } from 'react'
import { compoundById } from '@/content/compounds'
import type { CompoundEntry } from '@/content/schema'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { useDoses, useProtocols } from '@/data/hooks'
import { protocolCompoundIds, toDoseEvent, toProtocolLike } from '@/data/mappers'
import {
  adherence,
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

export interface CompoundExposure {
  compoundId: string
  compound: CompoundEntry | undefined
  pk: PkParams | undefined
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
}

/** Re-express a protocol for one of its compounds (a stack component keeps its fixed dose). */
export function protocolFor(protocol: ProtocolLike, compoundId: string): ProtocolLike {
  if (protocol.compoundId === compoundId) return protocol
  const component = protocol.components?.find((c) => c.compoundId === compoundId)
  if (!component) return protocol
  return {
    ...protocol,
    compoundId,
    components: [],
    steps: protocol.steps.map((s) => ({ ...s, doseMg: s.pause ? 0 : component.doseMg })),
  }
}

export function deriveExposure(
  protocols: readonly ProtocolRow[],
  doses: readonly DoseRow[],
  now: Date,
): CompoundExposure[] {
  const active = protocols.filter((p) => p.status === 'active')
  const ids = new Set<string>([
    ...active.flatMap(protocolCompoundIds),
    ...doses.map((d) => d.compound_id),
  ])
  const out: CompoundExposure[] = []
  for (const compoundId of ids) {
    const compound = compoundById(compoundId)
    const pk = compound?.pk
    const protocol = active.find((p) => protocolCompoundIds(p).includes(compoundId)) ?? null
    const protocolLike = protocol ? protocolFor(toProtocolLike(protocol), compoundId) : null
    const cDoses = doses
      .filter((d) => d.compound_id === compoundId)
      .toSorted((a, b) => a.administered_at.localeCompare(b.administered_at))
    const history = cDoses.map(toDoseEvent)
    const lastDose = history[history.length - 1] ?? null
    const reference = protocolLike ? referenceRegimen(protocolLike, now) : null

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
    })
  }
  // Active protocols first, then most recently dosed.
  return out.toSorted((a, b) => {
    if (Boolean(a.protocol) !== Boolean(b.protocol)) return a.protocol ? -1 : 1
    return (b.lastDose?.at.getTime() ?? 0) - (a.lastDose?.at.getTime() ?? 0)
  })
}

export function useExposure(patientId: string | undefined, now: Date = new Date()) {
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  const nowKey = Math.floor(now.getTime() / 60_000) // re-derive at most once a minute
  const items = useMemo(
    () => deriveExposure(protocols.data ?? [], doses.data ?? [], new Date(nowKey * 60_000)),
    [protocols.data, doses.data, nowKey],
  )
  return {
    items,
    primary: items[0] ?? null,
    isPending: protocols.isPending || doses.isPending,
    isError: protocols.isError || doses.isError,
    protocols: protocols.data ?? [],
    doses: doses.data ?? [],
  }
}
