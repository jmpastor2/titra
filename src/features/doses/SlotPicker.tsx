import { clsx } from 'clsx'
import { Check, Info, TrendingUp } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/primitives'
import { useLocale } from '@/lib/useLocale'
import { fmtDeltaMin, ON_TIME_MIN } from './delta'
import { SheetSection } from './SheetSection'
import { slotWeekdayText, slotWhenText } from './slotText'
import type { Consequence, SlotOption } from './slotView'
import type { SlotAssignment } from './useSlotAssignment'

/**
 * "Cuenta para": which planned administration this dose covers. Automatic when it lands on
 * one by its time; a missed one can be picked for a late dose or an extra taken to make it
 * up, so progress does not end up as "one missed, one extra". Nothing to choose: one line.
 */
export function SlotPicker({
  assignment,
  hideLabel = false,
  className,
}: {
  assignment: SlotAssignment
  /** In a sheet whose title already asks which one it covers. */
  hideLabel?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const labelId = useId()
  const { view, selected, consequence, choose, doseAt } = assignment

  const delay = (min: number) =>
    Math.abs(min) <= ON_TIME_MIN ? t('editDose.slot.onTime') : fmtDeltaMin(min)
  const when = (option: Extract<SlotOption, { slot: object }>) =>
    slotWhenText(option.slot, t, locale)

  function text(option: SlotOption): { title: string; sub?: string } {
    switch (option.kind) {
      case 'extra':
        return { title: t('editDose.slot.extra'), sub: t('editDose.slot.extraWhy') }
      case 'auto':
        return {
          title: t('editDose.slot.auto', { slot: when(option) }),
          sub: delay(Math.round((doseAt.getTime() - option.slot.at.getTime()) / 60_000)),
        }
      case 'missed':
        return { title: t('editDose.slot.missed', { slot: when(option) }) }
      case 'current':
        return { title: t('editDose.slot.current', { slot: when(option) }) }
    }
  }

  function sentence(c: Consequence): { icon: typeof Check; text: string; tone: string } {
    switch (c.kind) {
      case 'extra':
        return { icon: Info, text: t('editDose.slot.then.extra'), tone: 'text-accent' }
      case 'auto':
        return {
          icon: Check,
          text: t('editDose.slot.then.auto', {
            slot: slotWhenText(c.slot, t, locale),
            delay: delay(c.deltaMin),
          }),
          tone: 'text-signal',
        }
      case 'makeUp':
        return {
          icon: TrendingUp,
          text: t(
            Math.abs(c.deltaMin) <= ON_TIME_MIN
              ? 'editDose.slot.then.makeUpOnTime'
              : 'editDose.slot.then.makeUp',
            { day: slotWeekdayText(c.slot, locale) },
          ),
          tone: 'text-signal',
        }
      case 'same':
        return {
          icon: Check,
          text: t('editDose.slot.then.same', { day: slotWeekdayText(c.slot, locale) }),
          tone: 'text-signal',
        }
    }
  }

  const then = sentence(consequence)
  const Icon = then.icon
  const choosable = view.options.length > 1

  return (
    <SheetSection
      label={t('editDose.slot.label')}
      labelId={labelId}
      hideLabel={hideLabel}
      className={className}
    >
      {choosable && (
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="flex flex-col divide-y divide-line border-y border-line"
        >
          {view.options.map((option) => {
            const on = option.key === selected.key
            const { title, sub } = text(option)
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(option.key)}
                className="flex min-h-[52px] w-full items-center gap-3 py-2.5 text-left outline-none transition-opacity active:opacity-70"
              >
                <span
                  aria-hidden
                  className={clsx(
                    'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    on ? 'border-signal' : 'border-line-strong',
                  )}
                >
                  {on && <span className="size-2.5 rounded-full bg-signal" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={clsx(
                      'block text-[14.5px] font-semibold leading-snug',
                      on ? 'text-ink' : 'text-ink-2',
                    )}
                  >
                    {title}
                  </span>
                  {sub && (
                    <span className="block text-[12.5px] leading-snug text-muted">{sub}</span>
                  )}
                </span>
                {option.recommended && <Badge tone="brand">{t('editDose.slot.recommended')}</Badge>}
              </button>
            )
          })}
        </div>
      )}
      {/* Two lines kept for the sentence, so choosing another option never moves what follows. */}
      <p
        aria-live="polite"
        className="flex min-h-[2lh] items-start gap-2 text-[13px] leading-snug text-ink-2"
      >
        <Icon aria-hidden className={clsx('mt-px size-4 shrink-0', then.tone)} />
        <span>{then.text}</span>
      </p>
    </SheetSection>
  )
}
