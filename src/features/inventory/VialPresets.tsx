import { Info, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Chip, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { BLEND_PRESETS, type BlendPreset } from './blendPresets'

/** The common vials as a row of chips, one tap to fill the form with their usual contents. */
export function PresetChips({
  activeId,
  onPick,
}: {
  activeId: string | undefined
  onPick: (preset: BlendPreset) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="spec mb-2 flex items-center gap-1.5">
        <Layers className="size-3.5" /> {t('inventory.blendPresets')}
      </div>
      <div className="flex flex-wrap gap-2">
        {BLEND_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            aria-pressed={activeId === p.id}
            className="flex min-h-11 max-w-full items-center gap-1.5 rounded-2xl border border-line-strong bg-panel-2 px-3.5 py-1.5 text-left text-[12.5px] font-semibold leading-tight aria-pressed:border-signal/50 aria-pressed:bg-signal-soft"
          >
            <span className="flex shrink-0 gap-1">
              {p.parts.map((x) => (
                <SubstanceDot key={x.compoundId} color={compoundColor(x.compoundId)} />
              ))}
            </span>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Under the content field once a preset was used: the other usual sizes (single substances
 * only) and the reminder that the amounts are the usual ones, to edit if the vial differs.
 */
export function PresetNote({
  preset,
  totalMg,
  showSizes,
  onSize,
}: {
  preset: BlendPreset
  totalMg: number
  showSizes: boolean
  onSize: (mg: number) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <div className="-mt-1 flex flex-col gap-2.5">
      {preset.sizes && showSizes && (
        <div role="group" aria-label={t('inventory.sizes')} className="flex flex-wrap gap-2">
          {preset.sizes.map((size) => (
            <Chip
              key={size}
              active={totalMg === size}
              onClick={() => onSize(size)}
              className="min-h-11 px-3.5"
            >
              <span className="readout">{fmtNumber(size, locale, 0)} mg</span>
            </Chip>
          ))}
        </div>
      )}
      <p className="flex items-start gap-2 text-[12.5px] leading-snug text-muted">
        <Info className="mt-px size-4 shrink-0 text-signal" aria-hidden />
        {t('inventory.presetNote', { name: preset.name })}
      </p>
    </div>
  )
}
