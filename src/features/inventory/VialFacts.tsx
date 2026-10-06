import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { roundUnits } from '@/domain/dosing/draw'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { fmtDate, fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtConc, fmtPerUnit, fmtUnits } from './vialFormat'
import { concentrationOf, needsReconstitution, waterOf, type VialRunway } from './vials'

interface Fact {
  label: string
  value: string
  sub?: string | undefined
  accent?: boolean
}

/**
 * The two readings under a vial's numbers, as a definition grid. Reconstituted: the units
 * for the current dose and the concentration. A pen or tablets, which have nothing to mix:
 * the day it was opened. Powder has nothing to read yet (its use-by date is on the card).
 */
export function VialFacts({
  item,
  runway,
  nextDoseMg,
}: {
  item: InventoryRow
  runway: VialRunway | undefined
  /** The next dose of this compound, for any reconstituted vial of it. */
  nextDoseMg: number | null | undefined
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const conc = concentrationOf(item)
  const facts: Fact[] = []

  if (conc) {
    const unit = compoundById(item.compound_id)?.defaultUnit ?? 'mg'
    const doseMg = runway?.nextDoseMg ?? nextDoseMg ?? null
    const units = doseMg ? roundUnits(mgToUnits(doseMg, conc)) : null
    const water = waterOf(item)
    facts.push(
      units !== null && doseMg
        ? {
            // The dose of the next administration (a step-up already counts), not today's step.
            label: t('inventory.nextDoseShort'),
            value: fmtUnits(units, locale),
            sub: fmtDose(doseMg, unit, locale),
            accent: true,
          }
        : { label: t('inventory.eachUnit'), value: fmtPerUnit(conc / 100, unit, locale) },
      {
        label: t('calculator.concentration'),
        value: fmtConc(conc, locale),
        sub: water ? t('inventory.inWater', { water: fmtNumber(water, locale, 2) }) : undefined,
      },
    )
  } else if (!needsReconstitution(item) && item.opened_at) {
    facts.push({
      label: t('inventory.openedAt'),
      value: fmtDate(new Date(`${item.opened_at}T12:00`), locale, 'd MMM yy'),
    })
  }

  if (facts.length === 0) return null
  return (
    <dl className="grid grid-cols-2 gap-x-4 border-t border-line px-4 py-3.5">
      {facts.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="spec leading-snug">{f.label}</dt>
          <dd className="mt-1">
            <span
              className={clsx(
                'readout block text-[18px] font-semibold leading-tight',
                f.accent && 'text-signal',
              )}
            >
              {f.value}
            </span>
            {f.sub && (
              <span className="readout mt-0.5 block text-[12px] leading-snug text-muted">
                {f.sub}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
