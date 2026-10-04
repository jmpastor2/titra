import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'

/** One dot per substance the protocol holds, in the colour of its family. */
export function SubstanceDots({ protocol }: { protocol: ProtocolRow }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {protocolCompoundIds(protocol).map((id) => (
        <SubstanceDot key={id} color={compoundColor(id)} />
      ))}
    </span>
  )
}
