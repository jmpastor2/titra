import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const TONE = {
  signal: 'text-signal',
  danger: 'text-danger',
  muted: 'text-ink-2',
} as const

/**
 * A secondary action written as a coloured word (with an optional icon): no fill and no
 * border, still a 44 px target. Its colour is its own, not a ghost button's grey overridden.
 */
export function TextButton({
  tone = 'signal',
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: keyof typeof TONE
  icon?: ReactNode
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[14.5px] font-semibold outline-none transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:ring-signal/60 disabled:opacity-50',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
