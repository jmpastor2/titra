/**
 * How a supply is named on screen: a blend that is exactly one protocol's mix reads by that
 * protocol's name ("KLOW"), not as four substances in a row; anything else lists its
 * substances. Pure; see supplyName.test.ts.
 */
import { compoundById } from '@/content/compounds'
import type { ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id

/** "GHK-Cu + BPC-157 + TB-500 + KPV": the substances themselves. */
export const substanceNames = (compoundIds: readonly string[]): string =>
  compoundIds.map(nameOf).join(' + ')

export function supplyName(
  compoundIds: readonly string[],
  protocols: readonly Pick<ProtocolRow, 'name' | 'compound_id' | 'components' | 'status'>[],
): string {
  if (compoundIds.length > 2) {
    const wanted = [...new Set(compoundIds)].toSorted().join('+')
    const match = protocols.find(
      (p) =>
        p.status !== 'archived' &&
        p.name.trim() !== '' &&
        [...new Set(protocolCompoundIds(p as ProtocolRow))].toSorted().join('+') === wanted,
    )
    if (match) return match.name.trim()
  }
  return substanceNames(compoundIds)
}
