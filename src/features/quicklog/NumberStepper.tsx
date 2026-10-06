import { clsx } from 'clsx'
import { Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { canAutoFocusFields } from '@/components/ui/Sheet'
import { fmtNumber, type Locale } from '@/lib/format'
import { HOLD_MS, parseNumber, repeatStep, stepValue, type StepSpec } from './stepper'
import { fmtFixed } from './text'

interface Props {
  /** In display units; null while there is nothing to start from. */
  value: number | null
  onChange: (next: number | null) => void
  spec: StepSpec
  unit: string
  /** Name of the number field for assistive tech ("Peso"). */
  label: string
  locale: Locale
  size?: 'lg' | 'sm'
  /** Focus the field when the sheet opens, for a first reading with nothing to step from. */
  autoFocus?: boolean
  invalid?: boolean
}

/** Press to step, hold to repeat (faster the longer it is held). */
function useHold(fire: (multiplier: number) => void) {
  const latest = useRef(fire)
  useEffect(() => {
    latest.current = fire
  })
  const timer = useRef(0)
  const repeats = useRef(0)

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    repeats.current = 0
  }, [])
  useEffect(() => stop, [stop])

  const start = useCallback(() => {
    stop()
    latest.current(1)
    const loop = () => {
      const { delayMs, multiplier } = repeatStep(repeats.current++)
      latest.current(multiplier)
      timer.current = window.setTimeout(loop, delayMs)
    }
    timer.current = window.setTimeout(loop, HOLD_MS)
  }, [stop])

  return { start, stop }
}

function StepButton({
  direction,
  label,
  size,
  disabled,
  fire,
}: {
  direction: 1 | -1
  label: string
  size: 'lg' | 'sm'
  disabled: boolean
  fire: (multiplier: number) => void
}) {
  const hold = useHold(fire)
  const Icon = direction === 1 ? Plus : Minus
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        // Keep the press even if the finger drifts off the button while holding.
        e.currentTarget.setPointerCapture?.(e.pointerId)
        hold.start()
      }}
      onPointerUp={hold.stop}
      onPointerCancel={hold.stop}
      onLostPointerCapture={hold.stop}
      // A tap already stepped on pointer down; only a keyboard activation (no pointer) lands here.
      onClick={(e) => {
        if (e.detail === 0) fire(1)
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={clsx(
        'grid shrink-0 touch-none select-none place-items-center rounded-full border border-line-strong bg-panel-2 text-ink outline-none transition active:scale-95 active:bg-panel-3 focus-visible:ring-2 focus-visible:ring-signal/60 disabled:opacity-40',
        size === 'lg' ? 'size-[60px]' : 'size-11',
      )}
    >
      <Icon className={size === 'lg' ? 'size-6' : 'size-[18px]'} strokeWidth={2.25} />
    </button>
  )
}

/**
 * The fast entry of a number: big readout, − and + around it (hold to repeat), tap the
 * number to type. Values are in the units the person sees; the caller converts to storage.
 */
export function NumberStepper({
  value,
  onChange,
  spec,
  unit,
  label,
  locale,
  size = 'lg',
  autoFocus,
  invalid,
}: Props) {
  const { t } = useTranslation()
  // What is being typed, until the field is left; the stepped value otherwise.
  const [draft, setDraft] = useState<string | null>(null)
  // Taps can come faster than renders: step from the latest value, not the rendered one.
  const current = useRef(value)
  useEffect(() => {
    current.current = value
  }, [value])
  const input = useRef<HTMLInputElement>(null)
  // The sheet focuses the field it opens with; this covers one that only becomes empty
  // (no earlier reading) once its data has arrived.
  useEffect(() => {
    // Not on a phone: the on-screen keyboard would cover the sheet as it opens.
    if (autoFocus && canAutoFocusFields()) input.current?.focus({ preventScroll: true })
  }, [autoFocus])

  const step = useCallback(
    (direction: 1 | -1, multiplier: number) => {
      if (current.current === null) return
      const next = stepValue(spec, current.current, direction, multiplier)
      current.current = next
      setDraft(null)
      onChange(next)
    },
    [spec, onChange],
  )

  const shown = draft ?? (value === null ? '' : fmtFixed(value, locale, spec.digits))
  const stepText = fmtNumber(spec.step, locale, 2)
  const empty = value === null && draft === null

  return (
    <div className="flex items-center justify-between gap-2">
      <StepButton
        direction={-1}
        size={size}
        disabled={value === null}
        label={t('measure.less', { what: label, step: stepText, unit })}
        fire={(m) => step(-1, m)}
      />
      <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
        <input
          ref={input}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          data-autofocus={autoFocus || undefined}
          aria-label={label}
          aria-invalid={invalid || undefined}
          placeholder="—"
          value={shown}
          // Wide enough for the number and never under a 44 px target, however tight the row.
          style={{ width: `${Math.max(3, shown.length) + 0.5}ch`, minWidth: '2.75rem' }}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            setDraft(e.target.value)
            onChange(parseNumber(e.target.value, spec.digits))
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
            e.preventDefault()
            step(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 10 : 1)
          }}
          className={clsx(
            'readout min-w-0 border-0 border-b-2 bg-transparent p-0 text-center font-semibold leading-none outline-none transition-colors placeholder:text-muted/60 focus:border-signal',
            size === 'lg' ? 'pb-1.5 text-[44px]' : 'h-11 text-[24px]',
            invalid ? 'border-danger text-danger' : empty ? 'border-line-strong' : 'border-line',
          )}
        />
        <span
          className={clsx(
            'font-semibold text-muted',
            size === 'lg' ? 'text-[16px]' : 'text-[13px]',
          )}
        >
          {unit}
        </span>
      </div>
      <StepButton
        direction={1}
        size={size}
        disabled={value === null}
        label={t('measure.more', { what: label, step: stepText, unit })}
        fire={(m) => step(1, m)}
      />
    </div>
  )
}
