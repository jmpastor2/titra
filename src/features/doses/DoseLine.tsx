import { ChevronDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Field'
import { Badge, Segmented, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { mgToUnits } from '@/domain/dosing/reconstitution'
import type { DoseUnit } from '@/domain/types'
import { concentrationFor } from '@/features/inventory/vials'
import { fmtDose, fmtNumber, type Locale } from '@/lib/format'
import {
  entryAmount,
  entryMg,
  fromMg,
  parseAmount,
  plain,
  unitOf,
  type Entry,
  type Line,
} from './doseLines'
import { shortName, shortNames } from './substanceNames'

/** A dose a blend partner gets from the same draw. */
export interface PartnerDose {
  compoundId: string
  mg: number | null
}

const NO_PARTNERS: readonly PartnerDose[] = []

/** A vial name longer than this does not fit its menu on a phone. */
const LONG_LABEL = 22

/**
 * One draw of a dose form: the amount typed in syringe units, mg or mcg (the same dose
 * shown in the other units as you type), the vial it comes from and, for a blend, what its
 * partners get. Shared by the log and the edit sheets.
 */
export function DoseLine({
  line,
  vials,
  locale,
  removable = false,
  onChange,
  onRemove,
  partnerDoses = NO_PARTNERS,
  lastMg,
  credit,
}: {
  line: Line
  /** The vials it can be drawn from. */
  vials: readonly InventoryRow[]
  locale: Locale
  removable?: boolean
  onChange: (p: Partial<Line>) => void
  onRemove?: () => void
  /** Blend partners drawn with this line and the mg each one gets. */
  partnerDoses?: readonly PartnerDose[]
  /** mg of the last logged dose of this compound, for the quick pick. */
  lastMg?: number
  /** Editing: the dose being replaced goes back to its vial, so it still counts as available. */
  credit?: { inventoryId: string; mg: number }
}) {
  const { t } = useTranslation()
  const native = unitOf(line.compoundId)
  const vial = vials.find((v) => v.id === line.inventoryId)
  const concOf = (v: InventoryRow) => concentrationFor(v, line.compoundId)
  const conc = vial ? concOf(vial) : null
  const value = parseAmount(line.amount)
  const canUseUnits = vials.some((v) => concOf(v))
  // Peptides are dosed in mg or mcg interchangeably; other units (IU…) stay as they are.
  const doseUnits: DoseUnit[] = native === 'mg' || native === 'mcg' ? ['mg', 'mcg'] : [native]
  const picks: Entry[] = [...(canUseUnits ? (['units'] as const) : []), ...doseUnits]
  const current: Entry = line.mode === 'units' ? 'units' : line.doseUnit

  const lineDoseMg = entryMg(value, current, conc)

  // Live readout of the same dose in the other units.
  const others =
    lineDoseMg === null
      ? []
      : picks
          .filter((p) => p !== current && (p !== 'units' || conc))
          .map((p) =>
            p === 'units' && conc
              ? `${fmtNumber(mgToUnits(lineDoseMg, conc), locale, 1)} U`
              : p === 'units'
                ? ''
                : fmtDose(lineDoseMg, p, locale),
          )
          .filter(Boolean)

  function choose(entry: Entry) {
    if (entry === current) return
    // Convert what is typed so switching never silently changes the dose.
    let inventoryId = line.inventoryId
    let c = conc
    if (entry === 'units' && !c) {
      const target = vials.find((v) => concOf(v))
      if (target) {
        inventoryId = target.id
        c = concOf(target)
      }
    }
    const amount = lineDoseMg !== null ? entryAmount(lineDoseMg, entry, c) : line.amount
    onChange(
      entry === 'units'
        ? { mode: 'units', amount, inventoryId }
        : { mode: 'dose', doseUnit: entry, amount, inventoryId },
    )
  }

  // Units only mean something against a vial: without one, fall back to the dose itself.
  function changeVial(inventoryId: string) {
    const next = vials.find((v) => v.id === inventoryId)
    const nextConc = next ? concOf(next) : null
    if (line.mode === 'units' && !nextConc) {
      const amount = lineDoseMg !== null ? entryAmount(lineDoseMg, native, null) : line.amount
      onChange({ inventoryId, mode: 'dose', doseUnit: native, amount })
    } else if (line.mode === 'units' && nextConc && lineDoseMg !== null) {
      // Same dose from a vial of another strength: keep the dose, recompute the units.
      onChange({ inventoryId, amount: entryAmount(lineDoseMg, 'units', nextConc) })
    } else {
      onChange({ inventoryId })
    }
  }

  /** Quick picks: the protocol's dose and the last one logged, in the current unit. */
  const quick = [
    line.plannedMg ? { key: 'plan', label: t('doses.quickPlan'), mg: line.plannedMg } : null,
    lastMg && Math.abs(lastMg - (line.plannedMg ?? -1)) > 1e-9
      ? { key: 'last', label: t('doses.quickLast'), mg: lastMg }
      : null,
  ].filter((q): q is { key: string; label: string; mg: number } => q !== null)

  const available =
    vial && Number(vial.remaining_mg) + (credit?.inventoryId === vial.id ? credit.mg : 0)

  return (
    <div className="rounded-control border border-line bg-panel-2 p-3">
      <div className="mb-2 flex items-center gap-2">
        <SubstanceDot color={compoundColor(line.compoundId)} />
        {partnerDoses.map((p) => (
          <SubstanceDot key={p.compoundId} color={compoundColor(p.compoundId)} />
        ))}
        <span className="min-w-0 flex-1 break-words text-[14.5px] font-semibold">
          {shortNames([line.compoundId, ...partnerDoses.map((p) => p.compoundId)])}
        </span>
        {partnerDoses.length > 0 && <Badge tone="brand">{t('doses.blend')}</Badge>}
        {removable && (
          <button
            type="button"
            aria-label={t('common.delete')}
            onClick={onRemove}
            className="grid size-11 place-items-center rounded-full text-muted hover:text-danger"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Input
        inputMode="decimal"
        aria-label={t('doses.dose')}
        value={line.amount}
        onChange={(e) => onChange({ amount: e.target.value })}
        suffix={current === 'units' ? 'U' : t(`units.${current}`)}
        className="readout bg-panel text-[22px] font-semibold"
      />
      {picks.length > 1 && (
        <Segmented<Entry>
          value={current}
          onChange={choose}
          size="sm"
          className="mt-2"
          options={picks.map((p) => ({
            value: p,
            label: p === 'units' ? t('doses.pickUnits') : t(`units.${p}`),
          }))}
        />
      )}
      {others.length > 0 && (
        <div className="readout mt-2 text-[13px] font-semibold text-signal">
          = {others.join(' · ')}
        </div>
      )}
      {quick.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() =>
                onChange({
                  amount: entryAmount(q.mg, current, conc) || plain(fromMg(q.mg, native)),
                  ...(current === 'units' && !conc
                    ? { mode: 'dose' as const, doseUnit: native }
                    : {}),
                })
              }
              className="min-h-11 rounded-full border border-line-strong bg-panel px-3.5 py-1 text-[12px]"
            >
              <span className="text-muted">{q.label}</span>{' '}
              <span className="readout font-semibold">
                {conc ? `${fmtNumber(mgToUnits(q.mg, conc), locale, 1)} U · ` : ''}
                {fmtDose(q.mg, native, locale)}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2.5">
        {vials.length > 0 ? (
          <div className="relative">
            <select
              aria-label={t('doses.inventory')}
              value={line.inventoryId}
              onChange={(e) => changeVial(e.target.value)}
              className="h-11 w-full appearance-none truncate rounded-control border border-line bg-panel pl-3 pr-9 font-mono text-[12.5px] text-ink outline-none transition focus:border-signal/60"
            >
              <option value="">{t('doses.noInventory')}</option>
              {vials.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} · {fmtNumber(Number(v.remaining_mg), locale, 2)} mg
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-muted"
            />
          </div>
        ) : (
          <span className="font-mono text-[11.5px] text-muted">{t('doses.noVial')}</span>
        )}
        {/* A menu shows a long name cut short: say it in full underneath. */}
        {vial && vial.label.length > LONG_LABEL && (
          <p className="mt-1.5 break-words px-1 text-[12px] leading-snug text-muted">
            {vial.label}
          </p>
        )}
      </div>
      {partnerDoses.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 text-[12px] text-muted">
          {partnerDoses.map((p) => (
            <span key={p.compoundId} className="readout">
              {shortName(p.compoundId)}{' '}
              <span className="font-semibold text-signal">
                {p.mg !== null ? fmtDose(p.mg, unitOf(p.compoundId), locale) : '—'}
              </span>
            </span>
          ))}
        </div>
      )}
      {available !== undefined && lineDoseMg !== null && lineDoseMg > available + 1e-9 && (
        <p className="mt-1.5 text-[12px] font-semibold text-warn">
          {t('doses.vialShort', { left: fmtDose(available, native, locale) })}
        </p>
      )}
    </div>
  )
}
