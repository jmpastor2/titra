import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { roundUnits } from '@/domain/dosing/draw'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import { fmtDate, fmtDose, fmtNumber, type Locale } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtConc, fmtMg, fmtPerUnit, fmtUnits } from './vialFormat'
import { concentrationOf, fillOf, needsReconstitution, waterOf, type VialRunway } from './vials'

/** A date-only column as "5 oct 26", or a dash when there is none. */
function dayText(iso: string | null, locale: Locale): string {
  return iso ? fmtDate(new Date(`${iso}T12:00`), locale, 'd MMM yy') : '—'
}

/**
 * The readings under a vial's name. Powder: its content and label date. Reconstituted: the
 * concentration, the units for the current dose and how far it goes. A pen or tablets,
 * which have nothing to mix: the facts of the pack.
 */
export function VialFacts({
  item,
  runway,
  nextDoseMg,
  short,
}: {
  item: InventoryRow
  runway: VialRunway | undefined
  /** The next dose of this compound, for any reconstituted vial of it. */
  nextDoseMg: number | null | undefined
  /** Running low or expiring first: the supply reading is flagged. */
  short: boolean
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const total = Number(item.total_mg)
  const remaining = Number(item.remaining_mg)
  const conc = concentrationOf(item)

  if (needsReconstitution(item))
    return (
      <Grid cols={2}>
        <Cell
          label={t('inventory.content')}
          value={fmtMg(total, locale)}
          sub={t('inventory.lyophilised')}
        />
        <Cell
          label={t('inventory.labelExpiry')}
          value={dayText(item.expires_at, locale)}
          sub={item.expires_at ? undefined : t('common.optional')}
        />
      </Grid>
    )

  if (!conc)
    return (
      <Grid cols={3}>
        <Cell label={t('inventory.content')} value={fmtMg(total, locale)} />
        <Cell label={t('inventory.openedShort')} value={dayText(item.opened_at, locale)} />
        <Cell label={t('inventory.labelExpiry')} value={dayText(item.expires_at, locale)} />
      </Grid>
    )

  const unit = compoundById(item.compound_id)?.defaultUnit ?? 'mg'
  const doseMg = runway?.nextDoseMg ?? nextDoseMg ?? null
  const units = doseMg ? roundUnits(mgToUnits(doseMg, conc)) : null
  const water = waterOf(item)
  return (
    <Grid cols={3}>
      <Cell
        label={t('calculator.concentration')}
        value={fmtConc(conc, locale)}
        sub={water ? t('inventory.inWater', { water: fmtNumber(water, locale, 2) }) : undefined}
      />
      {units !== null && doseMg ? (
        <Cell
          label={t('inventory.yourDoseShort')}
          value={fmtUnits(units, locale)}
          sub={fmtDose(doseMg, unit, locale)}
          accent
        />
      ) : (
        <Cell label={t('inventory.eachUnit')} value={fmtPerUnit(conc / 100, unit, locale)} />
      )}
      {runway ? (
        <Cell
          label={t('inventory.covers')}
          value={t('inventory.dosesLeft', { count: runway.doses })}
          sub={
            runway.runsOutAt
              ? t('inventory.until', { date: fmtDate(runway.runsOutAt, locale, 'd MMM') })
              : undefined
          }
          warn={short}
        />
      ) : (
        <Cell
          label={t('inventory.left')}
          value={`${fmtNumber(fillOf(item) * 100, locale, 0)} %`}
          sub={fmtMg(remaining, locale)}
        />
      )}
    </Grid>
  )
}

function Grid({ cols, children }: { cols: 2 | 3; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'grid gap-px border-t border-line bg-line text-center',
        cols === 2 ? 'grid-cols-2' : 'grid-cols-3',
      )}
    >
      {children}
    </div>
  )
}

function Cell({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string
  value: string
  sub?: string | undefined
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className="min-w-0 bg-panel px-1.5 py-2.5">
      <div className="spec truncate text-[9.5px]">{label}</div>
      <div
        className={clsx(
          'readout mt-1 truncate font-semibold leading-tight',
          // A long reading ("166,7 mg/mL") steps down rather than being cut.
          value.length > 10 ? 'text-[14px]' : 'text-[16px]',
          warn ? 'text-warn' : accent ? 'text-signal' : '',
        )}
      >
        {value}
      </div>
      {sub && <div className="readout mt-0.5 truncate text-[11px] text-muted">{sub}</div>}
    </div>
  )
}
