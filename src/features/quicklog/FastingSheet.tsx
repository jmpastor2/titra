import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Meter } from '@/components/kpi/Meter'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { FastingControls } from '@/features/fasting/FastingCard'
import {
  clock,
  EAT_AFTER_MIN,
  fastingState,
  fastProgress,
  setLastMeal,
  useLastMeal,
} from '@/features/fasting/fasting'
import { useNow } from '@/lib/useNow'
import type { GlanceDose } from './doseGlance'

/** Last meal and the countdown to a fast that is long enough for the next GH dose. */
export function FastingSheet({
  fastFor,
  onClose,
}: {
  /** The next administration that asks for fasting, if one is coming up. */
  fastFor: GlanceDose | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const now = useNow(30_000)
  const lastMeal = useLastMeal(now)
  const s = fastingState(lastMeal, now)
  const waiting = lastMeal !== null && !s.ready

  /** After any answer: say what it did and offer to go back to the meal that was there. */
  function noted(at: Date | null) {
    const previous = lastMeal
    const undo = { label: t('quick.counter.undo'), onAction: () => setLastMeal(previous) }
    if (!at) {
      toast(t('fasting.cleared'), 'info', { action: undo })
      return
    }
    const after = fastingState(at, new Date())
    toast(
      after.ready
        ? t('fasting.notedReady')
        : t('fasting.notedWait', { at: clock(after.readyAt ?? at) }),
      'success',
      { action: undo },
    )
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={t('fasting.title')}>
      <div className="flex flex-col gap-5 py-1">
        <div>
          {!lastMeal ? null : waiting ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="readout text-[40px] font-semibold leading-none text-warn">
                {clock(s.readyAt ?? now)}
              </span>
              <span className="readout text-[13px] text-muted">
                {t('fasting.minLeft', { min: s.waitMin })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[20px] font-semibold">
              <Check className="size-5 shrink-0 text-signal" strokeWidth={3} aria-hidden />
              {t('fasting.fasted')}
            </div>
          )}
          {lastMeal && (
            <Meter
              className="mt-3"
              value={fastProgress(lastMeal, now)}
              height={8}
              color={waiting ? 'var(--warn)' : 'var(--signal)'}
            />
          )}
          <p className={clsx('text-[14px] font-medium text-ink-2', lastMeal && 'mt-2.5')}>
            {!lastMeal
              ? t('fasting.askShort')
              : s.ready
                ? t('fasting.ready', { since: clock(s.readyAt ?? now) })
                : t('fasting.wait', { at: clock(s.readyAt ?? now), min: s.waitMin })}
          </p>
          {fastFor && (
            <p className="mt-1 text-[13px] text-muted">
              {t('fasting.next', { name: fastFor.name, time: clock(fastFor.at) })}
            </p>
          )}
        </div>

        <FastingControls lastMeal={lastMeal} onSet={noted} />

        <p className="text-[12px] leading-snug text-muted">
          {t('fasting.rule', { after: EAT_AFTER_MIN })}
        </p>
      </div>
    </Sheet>
  )
}
