import { useCallback, useEffect, useMemo, useState } from 'react'
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
 * How long typing has to pause before the checks look at it. On the way to "150" the field
 * holds "1" and then "15", and each of those is a warning of its own: checked on every key,
 * a warning flashed in and out under the field while the number was still being written.
 */
export const WATER_SETTLE_MS = 600

/**
 * The water being entered for a vial and everything that follows from it: the amount in
 * mL, what the vial becomes, and the reasons to doubt it. Shared by the reconstitution
 * sheet and the vial form so both guard the same way. Units are the default because that
 * is what is measured on a syringe; `initialMl` is the water already saved, if any.
 *
 * The result follows every key; the warnings follow the amount once typing pauses (or the
 * field is left). A tap (a shortcut, the unit, a fix) is checked at once.
 */
export function useWaterEntry(draft: VialFields, initialMl: number | null, now: Date) {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const pref = useSyringePref()
  const [water, setWaterNow] = useState<WaterState>(() => ({
    text: initialMl && initialMl > 0 ? plainAmount(mlToAmount(initialMl, 'U')) : '',
    unit: 'U',
  }))
  // The water the warnings are about: the typed one once it has settled.
  const [checked, setChecked] = useState<WaterState>(water)

  useEffect(() => {
    if (checked === water) return
    const id = setTimeout(() => setChecked(water), WATER_SETTLE_MS)
    return () => clearTimeout(id)
  }, [water, checked])

  /** `typed` waits for the pause before checking; anything else is checked now. */
  const setWater = useCallback((next: WaterState, typed = false) => {
    setWaterNow(next)
    if (!typed) setChecked(next)
  }, [])

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

  const checkedAmount = parseAmount(checked.text)
  const checkedPreview =
    checked === water
      ? preview
      : reconstitutionPreview(draft, waterToMl(checkedAmount, checked.unit), doses)
  const issues = waterIssues({
    amount: checkedAmount,
    unit: checked.unit,
    contentMg: contentMgOf(draft),
    draws: checkedPreview?.draws ?? [],
    ...(pref === 'auto' ? {} : { barrel: pref }),
  })

  // Usable water: enough to make a concentration out of this vial.
  return { water, setWater, waterMl, valid: preview !== null, preview, issues, doses }
}

/** What `useWaterEntry` returns, for the components that render it. */
export type WaterEntry = ReturnType<typeof useWaterEntry>
