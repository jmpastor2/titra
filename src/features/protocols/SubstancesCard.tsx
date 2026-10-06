import { Plus, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { activeVial, isBlend } from '@/features/inventory/vials'
import { useLocale } from '@/lib/useLocale'
import { fmtEquivalent, mgToEntry, parseAmount, type DoseEntry } from './doseUnits'
import {
  blendPartnerMg,
  doseField,
  fieldMg,
  matchesBlend,
  type ComponentDraft,
  type ConcOf,
  type Draft,
} from './draft'
import { StackRow } from './StackRow'

/**
 * The primary substance and whatever else goes in the same syringe. From a premixed vial
 * that holds both, a stack dose that does not fill the same volume is flagged, with a tap
 * to match the mix.
 */
export function SubstancesCard({
  draft,
  vials,
  concOf,
  firstDoseMg,
  onPick,
  onPatchComponent,
  onComponentEntry,
  onRemoveComponent,
}: {
  draft: Pick<Draft, 'compoundId' | 'components' | 'doseEntry' | 'steps'>
  vials: readonly InventoryRow[]
  concOf: ConcOf
  /** The primary dose of the first dosing step in mg, to compare the stack against. */
  firstDoseMg: number | null
  onPick: (which: 'primary' | 'component') => void
  onPatchComponent: (key: number, patch: Partial<ComponentDraft>) => void
  onComponentEntry: (comp: ComponentDraft, entry: DoseEntry) => void
  onRemoveComponent: (key: number) => void
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const compound = draft.compoundId ? compoundById(draft.compoundId) : undefined
  const primaryConc = concOf(draft.compoundId)
  const primaryVial = activeVial(vials, draft.compoundId)
  const first = draft.steps.find((s) => !s.pause)

  /** Set when one premixed vial holds both and this dose does not fill the same volume. */
  function blendFor(c: ComponentDraft, conc: number | null, mg: number | null) {
    const vial = activeVial(vials, c.compoundId)
    if (!vial || primaryVial?.id !== vial.id || !isBlend(vial)) return null
    if (!firstDoseMg || !primaryConc || !conc || mg === null || !first) return null
    if (matchesBlend(firstDoseMg, primaryConc, mg, conc)) return null
    const expected = blendPartnerMg(firstDoseMg, primaryConc, conc)
    const amount = expected === null ? null : mgToEntry(expected, c.entry, conc)
    if (expected === null || amount === null) return null
    return {
      primary: fmtEquivalent({ entry: draft.doseEntry, amount: parseAmount(first.dose) }, locale),
      expected: fmtEquivalent({ entry: c.entry, amount }, locale),
      onMatch: () => onPatchComponent(c.key, doseField(expected, c.entry, conc)),
    }
  }

  return (
    <Card eyebrow="01" title={t('protocols.substances')}>
      <button
        type="button"
        onClick={() => onPick('primary')}
        className="flex w-full items-center gap-3 rounded-control border border-line-strong bg-panel-2 px-3.5 py-3 text-left"
      >
        {compound ? (
          <>
            <SubstanceDot color={compoundColor(compound.id)} size={10} />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-[15.5px] font-semibold">
                {compound.names.generic}
              </span>
              <span className="line-clamp-2 block text-[12px] text-muted">
                {pick(compound.pharmClass)}
              </span>
            </span>
            <span className="spec">{t('common.edit')}</span>
          </>
        ) : (
          <span className="flex items-center gap-2 text-[15px] font-semibold text-signal">
            <Plus className="size-4" /> {t('protocols.pickSubstance')}
          </span>
        )}
      </button>

      {draft.components.map((c) => {
        const conc = concOf(c.compoundId)
        const mg = fieldMg(c, c.entry, conc)
        return (
          <StackRow
            key={c.key}
            comp={c}
            conc={conc}
            vialLabel={activeVial(vials, c.compoundId)?.label}
            mg={mg}
            blend={blendFor(c, conc, mg)}
            onChange={(dose) => onPatchComponent(c.key, { dose })}
            onEntry={(to) => onComponentEntry(c, to)}
            onRemove={() => onRemoveComponent(c.key)}
          />
        )
      })}
      {draft.components.length > 0 && (
        <p className="mt-2.5 text-[12px] leading-snug text-muted">{t('protocols.stackHint')}</p>
      )}
      {compound && (
        <button
          type="button"
          onClick={() => onPick('component')}
          className="mt-2.5 flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-signal"
        >
          <Syringe className="size-4" /> {t('protocols.addToSyringe')}
        </button>
      )}
    </Card>
  )
}
