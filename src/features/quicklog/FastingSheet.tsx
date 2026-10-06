import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Meter } from '@/components/kpi/Meter'
import { Button } from '@/components/ui/Button'
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
import { BlockLabel } from './SheetBits'

/**
 * Last meal and the countdown to a fast that is long enough for the next GH dose. Every part
 * is drawn in every state (the gauge empty, the clear link hidden), so the sheet keeps its
 * height when a meal is cleared or the countdown runs out while it is open.
 */
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

  function ateNow() {
    const at = new Date()
    setLastMeal(at)
    noted(at)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('fasting.title')}
      description={
        fastFor ? t('fasting.next', { name: fastFor.name, time: clock(fastFor.at) }) : undefined
      }
      footer={
        <Button block size="lg" onClick={ateNow}>
          {t('fasting.justAte')}
        </Button>
      }
    >
      <div className="flex flex-col gap-7 pb-2 pt-1">
        <div>
          <div className="flex h-11 items-end justify-between gap-3">
            {waiting ? (
              <>
                <span className="readout text-[40px] font-semibold leading-none text-warn">
                  {clock(s.readyAt ?? now)}
                </span>
                <span className="readout pb-0.5 text-[13px] text-muted">
                  {t('fasting.minLeft', { min: s.waitMin })}
                </span>
              </>
            ) : lastMeal ? (
              <span className="flex items-center gap-2 text-[22px] font-semibold leading-none">
                <Check className="size-5 shrink-0 text-signal" strokeWidth={3} aria-hidden />
                {t('fasting.fasted')}
              </span>
            ) : (
              <span className="text-[22px] font-semibold leading-none text-muted">
                {t('quick.fasting.none')}
              </span>
            )}
          </div>
          <Meter
            className="mt-4"
            value={lastMeal ? fastProgress(lastMeal, now) : 0}
            height={6}
            color={waiting ? 'var(--warn)' : 'var(--signal)'}
          />
          <p className="mt-3 text-[14px] font-medium leading-snug text-ink-2">
            {!lastMeal
              ? t('fasting.askShort')
              : s.ready
                ? t('fasting.ready', { since: clock(s.readyAt ?? now) })
                : t('fasting.wait', { at: clock(s.readyAt ?? now), min: s.waitMin })}
          </p>
          {/* Two lines kept for it: the meal sentence and the rule are not the same length. */}
          <p className="mt-1 min-h-9 text-[12.5px] leading-snug text-muted">
            {lastMeal
              ? t('fasting.lastMeal', { at: clock(lastMeal), after: EAT_AFTER_MIN })
              : t('fasting.rule', { after: EAT_AFTER_MIN })}
          </p>
        </div>

        <div>
          <BlockLabel>{t('fasting.otherTime')}</BlockLabel>
          <FastingControls lastMeal={lastMeal} onSet={noted} justAte={false} clear={false} />
          <button
            type="button"
            onClick={() => {
              setLastMeal(null)
              noted(null)
            }}
            aria-hidden={!lastMeal || undefined}
            tabIndex={lastMeal ? undefined : -1}
            className={clsx(
              'mt-2 h-11 text-[13.5px] font-semibold text-muted outline-none focus-visible:ring-2 focus-visible:ring-signal/60',
              !lastMeal && 'invisible',
            )}
          >
            {t('fasting.clearMeal')}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
