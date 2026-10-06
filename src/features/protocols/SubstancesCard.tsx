import { Plus, Syringe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
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
    <Card title={t('protocols.substances')}>
      {compound ? (
        <button
          type="button"
          onClick={() => onPick('primary')}
          className="-mx-1 flex min-h-[56px] w-[calc(100%+0.5rem)] items-center gap-3 rounded-control px-1 text-left outline-none transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          <SubstanceDot color={compoundColor(compound.id)} size={10} />
          <span className="min-w-0 flex-1">
            <span className="block break-words text-[16px] font-semibold leading-snug">
              {compound.names.generic}
            </span>
            <span className="line-clamp-2 block text-[12.5px] leading-snug text-muted">
              {pick(compound.pharmClass)}
            </span>
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-signal">
            {t('protocols.change')}
          </span>
        </button>
      ) : (
        <Button
          variant="soft"
          block
          leading={<Plus className="size-4" />}
          onClick={() => onPick('primary')}
        >
          {t('protocols.pickSubstance')}
        </Button>
      )}

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
        <p className="mt-3 text-[12.5px] leading-snug text-muted">{t('protocols.stackHint')}</p>
      )}
      {compound && (
        <button
          type="button"
          onClick={() => onPick('component')}
          className="mt-1.5 flex min-h-11 items-center gap-1.5 text-[13.5px] font-semibold text-signal"
        >
          <Syringe aria-hidden className="size-4" /> {t('protocols.addToSyringe')}
        </button>
      )}
    </Card>
  )
}
