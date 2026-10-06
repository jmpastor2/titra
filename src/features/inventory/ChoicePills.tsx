import { clsx } from 'clsx'
import type { ReactNode } from 'react'

/**
 * One choice out of a few short words that do not fit a segmented control at 320 px
 * ("Comprimidos"): pills that wrap. The chosen one is tinted, not filled, so the only solid
 * shape in a sheet stays its main button. Each pill sits in a 44 px target.
 */
export function ChoicePills<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  /** Name of the group, for screen readers. */
  label: string
  value: T
  onChange: (next: T) => void
  options: readonly { value: T; label: ReactNode }[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-x-1.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="group inline-flex min-h-11 items-center outline-none"
          >
            <span
              className={clsx(
                'inline-flex h-9 items-center rounded-full border px-3 text-[13.5px] font-semibold transition group-focus-visible:ring-2 group-focus-visible:ring-signal/60',
                on
                  ? 'border-signal/45 bg-signal-soft text-ink'
                  : 'border-line text-ink-2 group-hover:border-line-strong',
              )}
            >
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
