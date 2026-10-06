import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { roundUnits } from '@/domain/dosing/draw'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { fmtDate, fmtDose, fmtNumber, type Locale } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtConc, fmtPerUnit, fmtUnits } from './vialFormat'
import { concentrationOf, needsReconstitution, waterOf, type VialRunway } from './vials'

/** A date-only column as "5 oct 26", or "sin fecha" when there is none. */
function dayText(iso: string | null, locale: Locale, none: string): string {
  return iso ? fmtDate(new Date(`${iso}T12:00`), locale, 'd MMM yy') : none
}

/**
 * The readings under a vial's numbers, as plain label and value rows that wrap instead of
 * being cut. Reconstituted: the units for the current dose and the concentration. Powder,
 * a pen or tablets, which have nothing to mix: the dates of the pack.
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
  const none = t('inventory.noDate')

  if (needsReconstitution(item))
    return (
      <Facts>
        <Fact
          label={t('inventory.labelExpiry')}
          value={dayText(item.expires_at, locale, none)}
          muted={!item.expires_at}
        />
      </Facts>
    )

  if (!conc)
    return (
      <Facts>
        <Fact
          label={t('inventory.openedAt')}
          value={dayText(item.opened_at, locale, none)}
          muted={!item.opened_at}
        />
        <Fact
          label={t('inventory.labelExpiry')}
          value={dayText(item.expires_at, locale, none)}
          muted={!item.expires_at}
        />
      </Facts>
    )

  const unit = compoundById(item.compound_id)?.defaultUnit ?? 'mg'
  const doseMg = runway?.nextDoseMg ?? nextDoseMg ?? null
  const units = doseMg ? roundUnits(mgToUnits(doseMg, conc)) : null
  const water = waterOf(item)
  return (
    <Facts>
      {units !== null && doseMg ? (
        <Fact
          label={t('inventory.yourDoseShort')}
          value={fmtUnits(units, locale)}
          sub={fmtDose(doseMg, unit, locale)}
          accent
        />
      ) : (
        <Fact label={t('inventory.eachUnit')} value={fmtPerUnit(conc / 100, unit, locale)} />
      )}
      <Fact
        label={t('calculator.concentration')}
        value={fmtConc(conc, locale)}
        sub={water ? t('inventory.inWater', { water: fmtNumber(water, locale, 2) }) : undefined}
      />
    </Facts>
  )
}

function Facts({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-line border-t border-line px-4">{children}</dl>
}

function Fact({
  label,
  value,
  sub,
  accent,
  muted,
}: {
  label: string
  value: string
  sub?: string | undefined
  accent?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5">
      <dt className="spec">{label}</dt>
      <dd
        className={clsx(
          'readout text-right text-[15px] font-semibold',
          accent && 'text-signal',
          muted && 'font-normal text-muted',
        )}
      >
        {value}
        {sub && <span className="ml-2 text-[12px] font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  )
}
