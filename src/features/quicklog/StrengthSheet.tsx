import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { NumberStepper } from './NumberStepper'
import type { StrengthWeek } from './readings'
import { AmountChip, BlockLabel, Choice } from './SheetBits'
import { inRange, stepSpec } from './stepper'
import { STRENGTH_WEEKLY_TARGET } from './tiles'

const SESSION_MINUTES: readonly number[] = [30, 45, 60]

interface Props {
  week: StrengthWeek
  /** Saves a session: its minutes (null when not noted) and whether it was yesterday. */
  onSave: (minutes: number | null, daysBack: 0 | 1) => void
  onClose: () => void
}

/**
 * A strength session: it starts from the length of the last one, so the same session again
 * is one tap on the main button; a chip or the stepper changes it first.
 */
export function StrengthSheet({ week, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const spec = stepSpec('resistance_session', false)
  const [when, setWhen] = useState<'0' | '1'>('0')
  const [minutes, setMinutes] = useState<number | null>(week.last?.minutes ?? 45)
  const daysBack = when === '1' ? 1 : 0
  const valid = minutes !== null && inRange(spec, minutes)

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('quick.strength.title')}
      description={t('quick.strength.week', {
        count: week.count,
        target: STRENGTH_WEEKLY_TARGET,
      })}
      footer={
        <Button
          block
          size="lg"
          disabled={!valid}
          onClick={() => valid && onSave(minutes, daysBack)}
        >
          {valid
            ? t('measure.saveValue', { value: `${fmtNumber(minutes, locale, 0)} min` })
            : t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-2 pt-1">
        <Choice<'0' | '1'>
          value={when}
          onChange={setWhen}
          label={t('measure.when')}
          options={[
            { value: '0', label: t('common.today') },
            { value: '1', label: t('common.yesterday') },
          ]}
        />

        <div>
          <BlockLabel>{t('quick.strength.length')}</BlockLabel>
          <NumberStepper
            value={minutes}
            onChange={setMinutes}
            spec={spec}
            unit="min"
            label={t('quick.strength.length')}
            locale={locale}
            invalid={minutes !== null && !inRange(spec, minutes)}
          />
          <div className="mt-4 flex gap-2.5">
            {SESSION_MINUTES.map((m) => (
              <AmountChip
                key={m}
                amount={String(m)}
                unit="min"
                label={t('measure.setValue', { value: `${m} min` })}
                active={minutes === m}
                onPress={() => setMinutes(m)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSave(null, daysBack)}
          className="-mt-2 h-11 self-start text-[13.5px] font-semibold text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          {t('quick.strength.noLength')}
        </button>
      </div>
    </Sheet>
  )
}
