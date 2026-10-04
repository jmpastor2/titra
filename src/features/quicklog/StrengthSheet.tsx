import { Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
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

/** A strength session in two taps: its length as a chip, and it is saved. */
export function StrengthSheet({ week, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const spec = stepSpec('resistance_session', false)
  const [when, setWhen] = useState<'0' | '1'>('0')
  const [custom, setCustom] = useState<number | null>(week.last?.minutes ?? 45)
  const daysBack = when === '1' ? 1 : 0

  return (
    <Sheet open onClose={onClose} title={t('quick.strength.title')}>
      <div className="flex flex-col gap-5 py-1">
        <p className="text-[14px] text-ink-2">
          {t('quick.strength.week', { count: week.count, target: STRENGTH_WEEKLY_TARGET })}
        </p>

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
          <div className="flex gap-2.5">
            {SESSION_MINUTES.map((minutes) => (
              <AmountChip
                key={minutes}
                amount={minutes}
                unit="min"
                label={t('quick.strength.log', { minutes })}
                tone="signal"
                onPress={() => onSave(minutes, daysBack)}
              />
            ))}
          </div>
        </div>

        <div>
          <BlockLabel>{t('quick.counter.other')}</BlockLabel>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <NumberStepper
                size="sm"
                value={custom}
                onChange={setCustom}
                spec={spec}
                unit="min"
                label={t('quick.strength.length')}
                locale={locale}
              />
            </div>
            <Button
              variant="soft"
              disabled={custom === null || !inRange(spec, custom)}
              leading={<Check className="size-4" />}
              onClick={() => custom !== null && onSave(custom, daysBack)}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSave(null, daysBack)}
          className="-mt-1 h-11 self-start px-1 text-[13px] font-semibold text-signal"
        >
          {t('quick.strength.noLength')}
        </button>
      </div>
    </Sheet>
  )
}
