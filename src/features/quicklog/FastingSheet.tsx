import { Check, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { ProgressRing } from '@/components/ui/primitives'
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
        <div className="flex flex-col items-center gap-3">
          <ProgressRing
            fraction={fastProgress(lastMeal, now)}
            size={156}
            stroke={11}
            color={waiting ? 'var(--warn)' : 'var(--signal)'}
          >
            <div className="text-center leading-none">
              {!lastMeal ? (
                <>
                  <Utensils className="mx-auto mb-2 size-5 text-muted" aria-hidden />
                  <div className="px-3 text-[12.5px] text-muted">{t('fasting.noMeal')}</div>
                </>
              ) : waiting ? (
                <>
                  <div className="readout text-[32px] font-semibold text-warn">
                    {clock(s.readyAt ?? now)}
                  </div>
                  <div className="mt-1.5 text-[12px] text-muted">
                    {t('fasting.minLeft', { min: s.waitMin })}
                  </div>
                </>
              ) : (
                <>
                  <Check
                    className="mx-auto mb-1.5 size-6 text-signal"
                    strokeWidth={3}
                    aria-hidden
                  />
                  <div className="text-[14px] font-semibold">{t('fasting.fasted')}</div>
                </>
              )}
            </div>
          </ProgressRing>
          <p className="text-center text-[14px] font-medium text-ink-2">
            {!lastMeal
              ? t('fasting.askShort')
              : s.ready
                ? t('fasting.ready', { since: clock(s.readyAt ?? now) })
                : t('fasting.wait', { at: clock(s.readyAt ?? now), min: s.waitMin })}
          </p>
        </div>

        {fastFor && (
          <p className="rounded-control border border-line bg-panel-2 px-3 py-2.5 text-[13px] text-ink-2">
            {t('fasting.next', { name: fastFor.name, time: clock(fastFor.at) })}
          </p>
        )}

        <FastingControls lastMeal={lastMeal} onSet={noted} />

        <p className="text-[12px] leading-snug text-muted">
          {t('fasting.rule', { after: EAT_AFTER_MIN })}
        </p>
      </div>
    </Sheet>
  )
}
