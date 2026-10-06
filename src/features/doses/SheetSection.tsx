import { clsx } from 'clsx'
import type { ReactNode } from 'react'

/**
 * One part of a sheet or form: a quiet label (the same 13 px as a field's) over its controls,
 * with an optional small action on the right. No panel around it: sections are told apart by
 * the space between them.
 */
export function SheetSection({
  label,
  labelId,
  action,
  hideLabel = false,
  className,
  children,
}: {
  label: ReactNode
  /** For a control group labelled by this heading (`aria-labelledby`). */
  labelId?: string
  action?: ReactNode
  /** The sheet's title already asks the question: the label stays for screen readers only. */
  hideLabel?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section className={clsx('flex flex-col gap-2', className)}>
      {hideLabel ? (
        <h3 id={labelId} className="sr-only">
          {label}
        </h3>
      ) : (
        <div className="flex min-h-6 items-center justify-between gap-3">
          <h3 id={labelId} className="min-w-0 text-[13px] font-medium text-ink-2">
            {label}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
