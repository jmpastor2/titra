import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { DoseInput, EntryNote, EntryToggle } from './DoseField'
import type { DoseEntry } from './doseUnits'
import { unitOf, type ComponentDraft } from './draft'

/**
 * A compound that rides in the same syringe as the primary: its dose for the first step,
 * typed in U, mg or mcg. Later steps follow it in proportion, like a premixed blend does.
 */
export function StackRow({
  comp,
  conc,
  vialLabel,
  mg,
  blend,
  onChange,
  onEntry,
  onRemove,
}: {
  comp: ComponentDraft
  /** mg/mL of this compound in its active vial; null without one. */
  conc: number | null
  vialLabel: string | undefined
  mg: number | null
  /** Set when a premixed vial holds both and this dose does not fill the same volume. */
  blend: { expected: string; primary: string; onMatch: () => void } | null
  onChange: (dose: string) => void
  onEntry: (entry: DoseEntry) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const compound = compoundById(comp.compoundId)
  const name = compound?.names.generic ?? comp.compoundId
  const native = unitOf(comp.compoundId)

  return (
    <div className="mt-2.5 rounded-control border border-line bg-panel-2 p-3">
      <div className="flex items-center gap-2">
        <SubstanceDot color={compoundColor(comp.compoundId)} />
        <span className="min-w-0 flex-1 break-words text-[14px] font-semibold">{name}</span>
        <button
          type="button"
          aria-label={t('common.delete')}
          onClick={onRemove}
          className="-my-2 -mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-danger"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="spec mb-1.5 mt-1">{t('protocols.stackDose')}</div>
      <DoseInput
        ariaLabel={`${name} · ${t('protocols.doseMg')}`}
        value={comp.dose}
        entry={comp.entry}
        native={native}
        conc={conc}
        mg={mg}
        onChange={onChange}
      />
      <EntryToggle
        entry={comp.entry}
        native={native}
        conc={conc}
        onChange={onEntry}
        className="mt-2.5"
      />
      <EntryNote
        className="mt-1.5 text-[12px] text-muted"
        native={native}
        conc={conc}
        vialLabel={vialLabel}
        name={name}
      />
      {blend && (
        <div className="mt-2.5 rounded-control border border-warn/30 bg-warn-soft px-3 py-2.5">
          <p className="text-[12.5px] leading-snug text-ink-2">
            {t('protocols.blendHint', { primary: blend.primary, expected: blend.expected, name })}
          </p>
          <Button size="md" variant="secondary" className="mt-2" onClick={blend.onMatch}>
            {t('protocols.blendMatch')}
          </Button>
        </div>
      )}
    </div>
  )
}
