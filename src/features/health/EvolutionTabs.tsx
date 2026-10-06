import { clsx } from 'clsx'
import type { ReactNode } from 'react'

/**
 * The tabs of "Evolución": the look of the app's segmented control, but the labels never end in an
 * ellipsis. On the narrowest phones the type steps down a size instead of cutting "Analíticas" short.
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
      className={clsx(
        'flex h-[46px] w-full items-stretch rounded-full border border-line bg-panel-2',
        className,
      )}
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
            className="group flex min-w-0 flex-1 items-center justify-center px-0.5 outline-none"
          >
            <span
              className={clsx(
                'flex h-[34px] w-full items-center justify-center whitespace-nowrap rounded-full px-1 text-[11.5px] font-semibold transition group-focus-visible:ring-2 group-focus-visible:ring-signal/60 min-[360px]:px-2 min-[360px]:text-[12.5px]',
                active
                  ? 'bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                  : 'text-muted group-hover:text-ink-2',
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
