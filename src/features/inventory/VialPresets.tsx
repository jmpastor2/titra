import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { BLEND_PRESETS, type BlendPreset } from './blendPresets'
import { ChoicePills } from './ChoicePills'

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
      <h3 className="spec mb-2">{t('inventory.blendPresets')}</h3>
      <div className="flex flex-wrap gap-2">
        {BLEND_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            aria-pressed={activeId === p.id}
            className="flex min-h-11 max-w-full items-center gap-2 rounded-[18px] border border-line px-3.5 py-1.5 text-left text-[13px] font-medium leading-tight text-ink-2 outline-none transition hover:border-line-strong focus-visible:ring-2 focus-visible:ring-signal/60 aria-pressed:border-signal/45 aria-pressed:bg-signal-soft aria-pressed:text-ink"
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
    <div className="flex flex-col gap-1.5 pt-1">
      {preset.sizes && showSizes && (
        <ChoicePills
          label={t('inventory.sizes')}
          value={String(totalMg)}
          onChange={(mg) => onSize(Number(mg))}
          options={preset.sizes.map((size) => ({
            value: String(size),
            label: <span className="readout">{fmtNumber(size, locale, 0)} mg</span>,
          }))}
        />
      )}
      <p className="flex items-start gap-2 text-[12.5px] leading-snug text-muted">
        <Info className="mt-px size-4 shrink-0 text-signal" aria-hidden />
        {t('inventory.presetNote', { name: preset.name })}
      </p>
    </div>
  )
}
