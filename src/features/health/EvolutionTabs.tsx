import { clsx } from 'clsx'
import type { ReactNode } from 'react'

/**
 * The tabs of "Evolución": quiet words on a hairline, the chosen one in ink with a short bar under
 * it. Each tab is a full 44 px target, and the labels never end in an ellipsis: on the narrowest
 * phones the type steps down a size instead of cutting "Analíticas" short.
 */
export function EvolutionTabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={clsx('flex w-full items-stretch border-b border-line', className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              'relative flex min-h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap px-0.5 text-[12.5px] font-semibold outline-none transition-colors focus-visible:bg-panel-2 min-[360px]:text-[13.5px]',
              active ? 'text-ink' : 'text-muted hover:text-ink-2',
            )}
          >
            {o.label}
            <span
              aria-hidden
              className={clsx(
                'absolute inset-x-3 -bottom-px h-[2px] rounded-full',
                active ? 'bg-ink' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
