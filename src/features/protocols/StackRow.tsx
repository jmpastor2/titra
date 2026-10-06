import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { Caution } from './Caution'
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
    // One more compound in the syringe: a part of the card under a hairline, not a panel.
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex min-h-11 items-center gap-2">
        <SubstanceDot color={compoundColor(comp.compoundId)} />
        <span className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug">
          {name}
        </span>
        <button
          type="button"
          aria-label={t('common.delete')}
          onClick={onRemove}
          className="-mr-2.5 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
        >
          <X className="size-4" />
        </button>
      </div>
      <span className="text-[13px] font-medium text-ink-2">{t('protocols.stackDose')}</span>
      <EntryToggle entry={comp.entry} native={native} conc={conc} onChange={onEntry} />
      <DoseInput
        ariaLabel={`${name} · ${t('protocols.doseMg')}`}
        value={comp.dose}
        entry={comp.entry}
        native={native}
        conc={conc}
        mg={mg}
        onChange={onChange}
      />
      <EntryNote
        className="text-[12.5px] leading-snug text-muted"
        native={native}
        conc={conc}
        vialLabel={vialLabel}
        name={name}
      />
      {blend && (
        <div className="flex flex-col items-start gap-2">
          <Caution>
            {t('protocols.blendHint', { primary: blend.primary, expected: blend.expected, name })}
          </Caution>
          <Button size="sm" variant="secondary" onClick={blend.onMatch}>
            {t('protocols.blendMatch')}
          </Button>
        </div>
      )}
    </div>
  )
}
