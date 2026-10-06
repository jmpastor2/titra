import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import type { DoseUnit } from '@/domain/types'
import { useLocale } from '@/lib/useLocale'
import { blurOnEnter } from './blurOnEnter'
import { entriesFor, fmtEquivalents, fmtPerUnit, type DoseEntry } from './doseUnits'

/** Units / mg / mcg: how the dose is typed. Hidden when there is only one way. */
export function EntryToggle({
  entry,
  native,
  conc,
  onChange,
  className,
}: {
  entry: DoseEntry
  native: DoseUnit
  /** mg/mL of this compound in its active vial; null without one. */
  conc: number | null
  onChange: (entry: DoseEntry) => void
  className?: string
}) {
  const { t } = useTranslation()
  const entries = entriesFor(native, conc)
  if (entries.length < 2) return null
  return (
    <Segmented<DoseEntry>
      value={entry}
      onChange={onChange}
      className={className}
      options={entries.map((e) => ({
        value: e,
        label:
          e === 'units' ? t('protocols.entry.units') : t(`units.${e === 'native' ? native : e}`),
      }))}
    />
  )
}

/**
 * Under the toggle: which vial the units are measured against, or why there are none
 * (units need a reconstituted vial to mean anything).
 */
export function EntryNote({
  native,
  conc,
  vialLabel,
  name,
  className,
}: {
  native: DoseUnit
  conc: number | null
  vialLabel: string | undefined
  /** Compound name, for "no vial of X". */
  name: string
  className?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  if (entriesFor(native, conc).includes('units') && conc) {
    return (
      <p className={className ?? 'text-[12px] text-muted'}>
        {t('protocols.entry.vialNote', {
          vial: vialLabel ?? name,
          per: fmtPerUnit(conc, locale),
        })}
      </p>
    )
  }
  if (native !== 'mg' && native !== 'mcg') return null
  return (
    <p className={className ?? 'text-[12px] text-muted'}>
      {t('protocols.entry.noVial', { name })}{' '}
      <Link to="/inventory" className="font-semibold text-signal">
        {t('protocols.entry.addVial')}
      </Link>
    </p>
  )
}

/** "= 0,2 mg · 200 mcg": the typed dose in the other units. Nothing when there are none. */
export function DoseEquivalents({
  mg,
  entry,
  native,
  conc,
  className,
}: {
  /** The typed dose in mg (null while it is not a valid amount). */
  mg: number | null
  entry: DoseEntry
  native: DoseUnit
  conc: number | null
  className?: string
}) {
  const { locale } = useLocale()
  const equivalent = fmtEquivalents(mg, entry, native, conc, locale)
  // Where there are other units to show, the line keeps its place while the field is
  // emptied and retyped, so what is under it does not jump.
  if (!equivalent && entriesFor(native, conc).length < 2) return null
  return (
    <div
      className={clsx(
        'min-h-5',
        className ?? 'readout text-[13px] font-semibold leading-snug text-signal',
      )}
    >
      {equivalent}
    </div>
  )
}

/** The number typed, with its unit, and the same dose in the other units beneath. */
export function DoseInput({
  id,
  value,
  entry,
  native,
  conc,
  mg,
  onChange,
  describedBy,
  ariaLabel,
  className,
  autoFocus,
  equivalents = true,
  big = false,
}: {
  id?: string
  value: string
  entry: DoseEntry
  native: DoseUnit
  conc: number | null
  /** The typed dose in mg (null while it is not a valid amount), for the equivalents. */
  mg: number | null
  onChange: (text: string) => void
  describedBy?: string
  ariaLabel?: string
  className?: string
  /** Where a sheet puts the cursor when it opens. */
  autoFocus?: boolean
  /** Show the other units under the field; off when the caller lays them out itself. */
  equivalents?: boolean
  /** The one number of a sheet: large rounded numerals. */
  big?: boolean
}) {
  const { t } = useTranslation()
  const suffix =
    entry === 'units' ? t('units.units') : t(`units.${entry === 'native' ? native : entry}`)
  return (
    <>
      <Input
        id={id}
        inputMode="decimal"
        enterKeyHint="done"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        data-autofocus={autoFocus ? '' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={blurOnEnter}
        suffix={suffix}
        className={className ?? (big ? 'readout font-semibold' : 'readout')}
        // Above the 16 px floor phones get for every field (an unlayered rule that a utility
        // class cannot beat), so the large size is set inline.
        style={big ? { fontSize: 24 } : undefined}
      />
      {equivalents && <DoseEquivalents mg={mg} entry={entry} native={native} conc={conc} />}
    </>
  )
}
