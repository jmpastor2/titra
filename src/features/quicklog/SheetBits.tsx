import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, Equal } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { fmtNumber, type Locale } from '@/lib/format'

/** A big one-tap amount ("+250 ml"): tapping it is the whole action. */
export function AmountChip({
  amount,
  unit,
  label,
  onPress,
  tone = 'default',
}: {
  amount: number | string
  unit: string
  /** The action read out in full, "Añadir 250 ml". */
  label: string
  onPress: () => void
  tone?: 'default' | 'signal'
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={clsx(
        'flex h-14 min-w-0 flex-1 touch-manipulation select-none flex-col items-center justify-center rounded-control border outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60',
        tone === 'signal'
          ? 'border-signal/40 bg-signal-soft text-signal'
          : 'border-line-strong bg-panel-2 text-ink active:bg-panel-3',
      )}
    >
      <span aria-hidden className="readout text-[19px] font-semibold leading-none">
        {typeof amount === 'number' ? `+${amount}` : amount}
      </span>
      <span aria-hidden className="mt-1 text-[11px] font-medium leading-none text-muted">
        {unit}
      </span>
    </button>
  )
}

/** Silkscreen heading of a block inside a sheet. */
export function BlockLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
      <span className="spec">{children}</span>
      {action}
    </div>
  )
}

/**
 * The change against the last reading, in plain numbers and a neutral colour: a drop in
 * weight is not good news for everyone, so no red or green here.
 */
export function DeltaChip({
  delta,
  digits,
  unit,
  locale,
  className,
}: {
  delta: number
  digits: number
  unit: string
  locale: Locale
  className?: string
}) {
  const { t } = useTranslation()
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Equal
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2.5 py-1 text-[12.5px] font-semibold text-ink-2',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {delta === 0 ? (
        t('measure.same')
      ) : (
        <span className="readout">
          {sign}
          {fmtNumber(Math.abs(delta), locale, digits)} {unit}
        </span>
      )}
    </span>
  )
}

/** A pill with two or three choices ("Ahora | Otra fecha"), each a full 44 px target. */
export function Choice<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (next: T) => void
  options: readonly { value: T; label: ReactNode }[]
  /** What is being chosen, for assistive tech. */
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-full border border-line bg-panel-2 p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              'h-11 min-w-0 flex-1 touch-manipulation truncate rounded-full px-3 text-[14px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60',
              active
                ? 'bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                : 'text-muted hover:text-ink-2',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
