/**
 * "¿Qué te has puesto?": the things a person can log without hunting through a list. Each
 * protocol with its whole stack, each vial in stock (a blend vial is ONE entry, both
 * compounds logged, the stock drawn down once) and what was injected lately. Pure; see
 * freeChoices.test.ts.
 */
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import { planDraw } from '@/domain/dosing/draw'
import { concentrationOf, drawPartFor, vialContents } from '@/features/inventory/vials'
import { groupAdministrations } from './administrations'
import {
  lastMgOf,
  lineForVial,
  linesForProtocol,
  makeLine,
  mergeBlends,
  planDoses,
  type Line,
} from './doseLines'

export interface ProtocolChoice {
  kind: 'protocol'
  key: string
  protocol: ProtocolRow
  /** The stack, primary first, with the dose of this administration (undefined on a pause). */
  doses: { compoundId: string; mg: number | undefined }[]
  /** Syringe units to draw, when every compound has a reconstituted vial. */
  units: number | null
}

export interface VialChoice {
  kind: 'vial'
  key: string
  vial: InventoryRow
  /** What is in it: the vial's own compound first, then the rest of a blend. */
  compoundIds: string[]
  blend: boolean
  /** Reconstituted: ready to draw from. */
  liquid: boolean
}

export interface RecentChoice {
  kind: 'recent'
  key: string
  compoundIds: string[]
}

export type FreeChoice = ProtocolChoice | VialChoice | RecentChoice

export interface FreeChoices {
  protocols: ProtocolChoice[]
  vials: VialChoice[]
  recent: RecentChoice[]
}

export interface FreeChoiceSource {
  protocols: readonly ProtocolRow[]
  vials: readonly InventoryRow[]
  /** Recent doses, newest first. */
  doses: readonly DoseRow[]
  now: Date
}

/** How many recently injected combinations are offered. */
const RECENT_LIMIT = 6

const setKey = (ids: readonly string[]) => ids.toSorted().join('+')

export function freeChoices({ protocols, vials, doses, now }: FreeChoiceSource): FreeChoices {
  const activeProtocols = protocols.filter((p) => p.status === 'active')

  const protocolChoices = activeProtocols.map((protocol): ProtocolChoice => {
    const planned = planDoses(protocol, now)
    const plan = planDraw(planned.map((d) => drawPartFor(vials, d.compoundId, d.mg ?? 0)))
    return {
      kind: 'protocol',
      key: `protocol:${protocol.id}`,
      protocol,
      doses: planned,
      units: plan && plan.unknown.length === 0 ? plan.totalUnits : null,
    }
  })

  // Reconstituted vials first, the oldest opened first: the one in use leads.
  const vialChoices = vials
    .filter((v) => !v.archived && Number(v.remaining_mg) > 0)
    .toSorted(
      (a, b) =>
        Number(!concentrationOf(a)) - Number(!concentrationOf(b)) ||
        (a.opened_at ?? '9999').localeCompare(b.opened_at ?? '9999'),
    )
    .map((vial): VialChoice => {
      const compoundIds = vialContents(vial).map((c) => c.compoundId)
      return {
        kind: 'vial',
        key: `vial:${vial.id}`,
        vial,
        compoundIds,
        blend: compoundIds.length > 1,
        liquid: concentrationOf(vial) !== null,
      }
    })

  // What a protocol or a vial already offers is not offered again as "recent".
  const offered = new Set([
    ...activeProtocols.map((p) => setKey(protocolCompoundIds(p))),
    ...vialChoices.map((v) => setKey(v.compoundIds)),
  ])
  const recent: RecentChoice[] = []
  for (const admin of groupAdministrations(doses)) {
    if (recent.length >= RECENT_LIMIT) break
    const compoundIds = admin.rows.map((r) => r.compound_id)
    const key = setKey(compoundIds)
    if (offered.has(key)) continue
    offered.add(key)
    recent.push({ kind: 'recent', key: `recent:${key}`, compoundIds })
  }

  return { protocols: protocolChoices, vials: vialChoices, recent }
}

export interface ChosenLines {
  /** The protocol the dose is linked to, '' for a free dose. */
  protocolId: string
  lines: Line[]
}

/** The form lines for what was picked. A blend vial is one line carrying its partners. */
export function linesForChoice(choice: FreeChoice, source: FreeChoiceSource): ChosenLines {
  const { protocols, vials, doses, now } = source
  switch (choice.kind) {
    case 'protocol':
      return {
        protocolId: choice.protocol.id,
        lines: linesForProtocol(choice.protocol, vials, now),
      }
    case 'vial': {
      const compoundId = choice.vial.compound_id
      // The dose of the protocol that administers this compound, else the last one logged.
      const protocol = protocols.find((p) => p.status === 'active' && p.compound_id === compoundId)
      const plannedMg = protocol ? planDoses(protocol, now)[0]?.mg : undefined
      const mg = plannedMg ?? lastMgOf(doses, compoundId)
      return {
        protocolId: '',
        lines: [
          lineForVial(choice.vial, {
            ...(mg !== undefined ? { mg } : {}),
            ...(plannedMg !== undefined ? { plannedMg } : {}),
          }),
        ],
      }
    }
    case 'recent':
      return {
        protocolId: '',
        lines: mergeBlends(
          choice.compoundIds.map((id) => makeLine(id, lastMgOf(doses, id), vials)),
          vials,
        ),
      }
  }
}
