import { clsx } from 'clsx'
import { Check, Info, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { Badge } from '@/components/ui/primitives'
import { useLocale } from '@/lib/useLocale'
import { fmtDeltaMin, ON_TIME_MIN } from './delta'
import { SheetSection } from './SheetSection'
import { slotWeekdayText, slotWhenText } from './slotText'
import type { Consequence, SlotOption } from './slotView'
import type { SlotAssignment } from './useSlotAssignment'

/** The wording of the options and of what the chosen one does to the plan. */
function useSlotText(doseAt: Date) {
  const { t } = useTranslation()
  const { locale } = useLocale()

  const delay = (min: number) =>
    Math.abs(min) <= ON_TIME_MIN ? t('editDose.slot.onTime') : fmtDeltaMin(min)
  const when = (option: Extract<SlotOption, { slot: object }>) =>
    slotWhenText(option.slot, t, locale)

  function optionText(o: SlotOption): { title: string; sub?: string } {
    switch (o.kind) {
      case 'extra':
        return { title: t('editDose.slot.extra'), sub: t('editDose.slot.extraWhy') }
      case 'auto':
        return {
          title: t('editDose.slot.auto', { slot: when(o) }),
          sub: delay(Math.round((doseAt.getTime() - o.slot.at.getTime()) / 60_000)),
        }
      case 'missed':
        return { title: t('editDose.slot.missed', { slot: when(o) }) }
      case 'current':
        return { title: t('editDose.slot.current', { slot: when(o) }) }
    }
  }

  function consequence(c: Consequence): { icon: typeof Check; text: string; tone: string } {
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

  return { optionText, consequence }
}

/** What the chosen option does, in a sentence. Two lines kept, so a change never moves what follows. */
function SlotConsequence({ assignment }: { assignment: SlotAssignment }) {
  const then = useSlotText(assignment.doseAt).consequence(assignment.consequence)
  const Icon = then.icon
  return (
    <p
      aria-live="polite"
      className="flex min-h-[2lh] items-start gap-2 text-[13px] leading-snug text-ink-2"
    >
      <Icon aria-hidden className={clsx('mt-px size-4 shrink-0', then.tone)} />
      <span>{then.text}</span>
    </p>
  )
}

/** Every administration the dose can count for, as radios, with what the chosen one does. */
export function SlotOptions({
  assignment,
  onChosen,
}: {
  assignment: SlotAssignment
  /** Called after a choice, e.g. to close the sheet the options are in. */
  onChosen?: () => void
}) {
  const { t } = useTranslation()
  const { view, selected, choose, doseAt } = assignment
  const text = useSlotText(doseAt).optionText

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label={t('editDose.slot.label')}
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
              onClick={() => {
                choose(option.key)
                onChosen?.()
              }}
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
                {sub && <span className="block text-[12.5px] leading-snug text-muted">{sub}</span>}
              </span>
              {option.recommended && <Badge tone="brand">{t('editDose.slot.recommended')}</Badge>}
            </button>
          )
        })}
      </div>
      <SlotConsequence assignment={assignment} />
    </div>
  )
}

/**
 * "Cuenta para": which planned administration this dose covers. Automatic when it lands on
 * one by its time; a missed one can be picked for a late dose or an extra taken to make it
 * up, so progress does not end up as "one missed, one extra". In a form it is one sentence
 * of the same height whatever the time says, with the options a tap away: changing the time
 * never pushes the rest of the form around.
 */
export function SlotPicker({ assignment }: { assignment: SlotAssignment }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const choosable = assignment.view.options.length > 1

  return (
    <SheetSection
      label={t('editDose.slot.label')}
      action={
        choosable && (
          <button
            type="button"
            aria-label={t('editDose.slot.changeAria')}
            onClick={() => setOpen(true)}
            className="tap-link text-[13px] font-semibold text-signal"
          >
            {t('editDose.slot.change')}
          </button>
        )
      }
    >
      <SlotConsequence assignment={assignment} />
      <Sheet open={open} onClose={() => setOpen(false)} title={t('editDose.assign.title')}>
        <div className="pb-2 pt-1">
          <SlotOptions assignment={assignment} onChosen={() => setOpen(false)} />
        </div>
      </Sheet>
    </SheetSection>
  )
}
