import { useMemo, useState } from 'react'
import { usePatientScope } from '@/app/scope'
import { useProtocols } from '@/data/hooks'
import { useSyringePref } from '@/lib/syringePref'
import {
  contentMgOf,
  currentDoses,
  mlToAmount,
  parseAmount,
  plainAmount,
  reconstitutionPreview,
  waterIssues,
  waterToMl,
  type WaterUnit,
} from './reconstitute'
import { vialContents, type VialFields } from './vials'

export interface WaterState {
  /** What is typed, in `unit`. */
  text: string
  unit: WaterUnit
}

/**
 * The water being entered for a vial and everything that follows from it: the amount in
 * mL, what the vial becomes, and the reasons to doubt it. Shared by the reconstitution
 * sheet and the vial form so both guard the same way. Units are the default because that
 * is what is measured on a syringe; `initialMl` is the water already saved, if any.
 */
export function useWaterEntry(draft: VialFields, initialMl: number | null, now: Date) {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const pref = useSyringePref()
  const [water, setWater] = useState<WaterState>(() => ({
    text: initialMl && initialMl > 0 ? plainAmount(mlToAmount(initialMl, 'U')) : '',
    unit: 'U',
  }))

  const amount = parseAmount(water.text)
  const waterMl = waterToMl(amount, water.unit)
  const compoundKey = vialContents(draft)
    .map((c) => c.compoundId)
    .join('+')
  const day = now.toDateString()

  // The dose each active protocol gives now; a schedule walk, so not on every keystroke.
  const doses = useMemo(
    () => currentDoses(protocols.data ?? [], compoundKey.split('+'), new Date(`${day} 12:00`)),
    [protocols.data, compoundKey, day],
  )
  const preview = reconstitutionPreview(draft, waterMl, doses)
  const issues = waterIssues({
    amount,
    unit: water.unit,
    contentMg: contentMgOf(draft),
    draws: preview?.draws ?? [],
    ...(pref === 'auto' ? {} : { barrel: pref }),
  })

  // Usable water: enough to make a concentration out of this vial.
  return { water, setWater, waterMl, valid: preview !== null, preview, issues, doses }
}

/** What `useWaterEntry` returns, for the components that render it. */
export type WaterEntry = ReturnType<typeof useWaterEntry>
