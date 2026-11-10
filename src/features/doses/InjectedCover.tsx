import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DrawPlan } from '@/domain/dosing/draw'
import { PlanSyringe } from './PlanSyringe'

/** The syringe is shown full for a beat, then the plunger goes home. */
const HOLD_MS = 180
/** Long enough for the plunger of a mixed syringe and for the word to be read. */
const CLOSE_MS = 1500

/**
 * The moment after a dose is logged, over the whole sheet: the syringe that was prepared
 * empties and the sheet says it is done. A tap skips it. Purely a flourish: the dose is
 * already saved when this appears.
 */
export function InjectedCover({ plan, onDone }: { plan: DrawPlan; onDone: () => void }) {
  const { t } = useTranslation()
  const [pushed, setPushed] = useState(false)

  // The caller's handler may be a new function on every render: the timers must not restart.
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    const push = setTimeout(() => setPushed(true), HOLD_MS)
    const close = setTimeout(() => done.current(), CLOSE_MS)
    return () => {
      clearTimeout(push)
      clearTimeout(close)
    }
  }, [])

  return (
    <div
      role="status"
      onClick={onDone}
      className="fade-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-panel px-6"
    >
      {/* Mounted full without the draw-up, then animated as the plunger is pressed. */}
      <PlanSyringe plan={plan} animate={pushed} pushed={pushed} className="w-full max-w-sm" />
      <p
        className="flex items-center gap-2 text-[17px] font-semibold transition-opacity duration-500"
        style={{ opacity: pushed ? 1 : 0 }}
      >
        <Check aria-hidden className="size-5 text-signal" />
        {t('doses.logged')}
      </p>
    </div>
  )
}
