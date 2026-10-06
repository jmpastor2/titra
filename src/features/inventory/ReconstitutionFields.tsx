import { useTranslation } from 'react-i18next'
import { Field, Input } from '@/components/ui/Field'
import { Switch } from '@/components/ui/primitives'
import { ReconstitutionResult } from './ReconstitutionResult'
import type { WaterEntry } from './useWaterEntry'
import { WaterField } from './WaterField'

/**
 * "Already reconstituted" in the vial form: off, the vial is powder (the default, and
 * reconstituting is a later one-tap step); on, the water, the day and what they give.
 */
export function ReconstitutionFields({
  on,
  onToggle,
  entry,
  contentMg,
  date,
  max,
  onDate,
  discard,
}: {
  on: boolean
  onToggle: (next: boolean) => void
  entry: WaterEntry
  contentMg: number
  /** Day of reconstitution, yyyy-MM-dd. */
  date: string
  /** Latest day it can have been reconstituted: today. */
  max: string
  onDate: (date: string) => void
  discard: { date: Date; estimated: boolean } | null
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      {/* The whole row is the label, so the text is as good a target as the switch. */}
      <label className="flex min-h-11 items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">
            {t('inventory.alreadyReconstituted')}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
            {on ? t('inventory.reconstitutedHint') : t('inventory.lyophilisedHint')}
          </span>
        </span>
        <Switch checked={on} onChange={onToggle} label={t('inventory.alreadyReconstituted')} />
      </label>
      {on && (
        <div className="flex flex-col gap-4">
          <WaterField
            value={entry.water}
            onChange={entry.setWater}
            contentMg={contentMg}
            issues={entry.issues}
          />
          <Field label={t('inventory.reconstitutedAt')}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={date}
                max={max}
                onChange={(e) => onDate(e.target.value)}
              />
            )}
          </Field>
          <ReconstitutionResult preview={entry.preview} waterMl={entry.waterMl} discard={discard} />
        </div>
      )}
    </div>
  )
}
