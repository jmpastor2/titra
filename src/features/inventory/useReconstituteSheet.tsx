import { useState } from 'react'
import type { InventoryRow } from '@/data/database.types'
import { ReconstituteSheet } from './ReconstituteSheet'

/**
 * Opens the reconstitution sheet from anywhere: call `reconstitute(vial)` from a button and
 * render `sheet` once in the screen. The log flow uses it when a dose needs a concentration.
 */
export function useReconstituteSheet(now?: Date) {
  const [vial, setVial] = useState<InventoryRow | null>(null)
  const sheet = (
    <ReconstituteSheet
      vial={vial}
      open={vial !== null}
      onClose={() => setVial(null)}
      {...(now ? { now } : {})}
    />
  )
  return { reconstitute: setVial, sheet }
}
