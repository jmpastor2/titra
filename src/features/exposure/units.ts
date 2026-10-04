/**
 * What goes in one administration and how it reads to the person: "100 + 100 mcg", "15 U".
 * He thinks in syringe units and mcg/mg, so doses are shown in the unit each compound is
 * dosed in, and as units on the syringe when the vial's concentration is known.
 */
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { planDraw } from '@/domain/dosing/draw'
import { componentsAt } from '@/domain/dosing/schedule'
import type { ProtocolLike, StackComponent } from '@/domain/types'
import { drawPartFor } from '@/features/inventory/vials'
import { fmtDoseList, type Locale } from '@/lib/format'

/** The primary dose and the doses that ride with it at that primary dose, in mg. */
export function administrationOf(
  protocol: Pick<ProtocolLike, 'steps' | 'components'> | null,
  compoundId: string,
  doseMg: number,
): StackComponent[] {
  const partners = protocol
    ? componentsAt({ compoundId, startDate: '', times: [], ...protocol }, doseMg)
    : []
  return [{ compoundId, doseMg }, ...partners]
}

/** "100 + 100 mcg" for a blend dosed in one unit, "2 mg · 100 mcg" when the units differ. */
export function describeDoses(doses: readonly StackComponent[], locale: Locale): string {
  return fmtDoseList(
    doses.map((d) => ({
      valueMg: d.doseMg,
      unit: compoundById(d.compoundId)?.defaultUnit ?? 'mg',
    })),
    locale,
  )
}

/** Keeps a quantity and its unit on one line: "17,5 U", "150 + 150 mcg". */
export const noBreak = (text: string): string => text.replaceAll(' ', '\u00a0')

/** U-100 syringe units for an administration, when every compound has a reconstituted vial. */
export function unitsFor(
  doses: readonly StackComponent[],
  vials: readonly InventoryRow[],
): number | null {
  const plan = planDraw(doses.map((d) => drawPartFor(vials, d.compoundId, d.doseMg)))
  return plan && plan.unknown.length === 0 ? plan.totalUnits : null
}
