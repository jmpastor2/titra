import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, Equal } from 'lucide-react'
import type { MouseEvent, ReactNode, Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { fmtNumber, type Locale } from '@/lib/format'

/**
 * A one-tap amount as a soft pill: "+250 ml" adds at once (`tone="signal"`), "45 min" puts a
 * value in the field (`active` while it is the value there). No border: it is a control, not
 * a box.
 */
export function AmountChip({
  amount,
  unit,
  label,
  onPress,
  tone = 'default',
  active,
}: {
  amount: number | string
  unit: string
  /** The action read out in full, "Añadir 250 ml". */
  label: string
  onPress: () => void
  tone?: 'default' | 'signal'
  /** The value it stands for is the one in the field. */
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onPress}
      className={clsx(
        'grid h-12 min-w-0 flex-1 touch-manipulation select-none place-items-center rounded-full px-2 outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60',
        tone === 'signal' || active
          ? 'bg-signal-soft text-signal'
          : 'bg-panel-2 text-ink active:bg-panel-3',
      )}
    >
      <span aria-hidden className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="readout text-[18px] font-semibold">
          {typeof amount === 'number' ? `+${amount}` : amount}
        </span>
        <span className="text-[13px] font-medium opacity-75">{unit}</span>
      </span>
    </button>
  )
}

/** The quiet, sentence-case heading of a block inside a sheet, with an optional aside. */
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
 * weight is not good news for everyone, so no red or green here. `bare` drops the soft pill
 * for a row that is already tight.
 */
export function DeltaChip({
  delta,
  digits,
  unit,
  locale,
  bare = false,
  className,
}: {
  delta: number
  digits: number
  unit: string
  locale: Locale
  bare?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Equal
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-semibold text-ink-2',
        bare ? 'text-[12.5px]' : 'rounded-full bg-panel-2 px-2.5 py-1 text-[12.5px]',
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
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
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-panel-2 p-0.5">
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
              'min-h-11 min-w-0 flex-1 touch-manipulation rounded-full px-3 py-1 text-[14px] font-semibold leading-tight outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60',
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

/** A choice chip ("Náuseas", "HbA1c"): a pill that lights in iris when it is the one picked. */
export function PickChip({
  active,
  onPress,
  children,
  role,
  ref,
}: {
  active: boolean
  onPress: (e: MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
  /** "radio" inside a radiogroup; a toggle button otherwise. */
  role?: 'radio'
  ref?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      role={role}
      aria-checked={role === 'radio' ? active : undefined}
      aria-pressed={role === 'radio' ? undefined : active}
      onClick={onPress}
      className={clsx(
        'h-11 shrink-0 touch-manipulation whitespace-nowrap rounded-full px-4 text-[14px] outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60',
        active ? 'bg-signal-soft font-semibold text-signal' : 'bg-panel-2 text-ink-2',
      )}
    >
      {children}
    </button>
  )
}
