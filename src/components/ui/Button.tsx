import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  // The one luminous action colour: signal fill, dark ink, soft glow in the dark lab.
  primary:
    'bg-signal text-signal-ink glow hover:brightness-110 active:scale-[0.98] disabled:bg-panel-3 disabled:text-muted disabled:shadow-none',
  secondary:
    'bg-panel-2 text-ink border border-line-strong hover:border-signal/40 active:scale-[0.98] disabled:text-muted',
  soft: 'bg-signal-soft text-signal border border-signal/20 hover:bg-signal/15 active:scale-[0.98] disabled:opacity-60',
  ghost:
    'bg-transparent text-ink-2 hover:bg-panel-2 hover:text-ink active:scale-[0.98] disabled:text-muted',
  danger:
    'bg-danger-soft text-danger border border-danger/30 active:scale-[0.98] disabled:opacity-60',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-full',
  lg: 'h-14 px-6 text-[16px] gap-2 rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leading,
  trailing,
  block = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex select-none items-center justify-center font-semibold tracking-[-0.01em] outline-none transition-[transform,background-color,color,filter,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        leading
      )}
      {children}
      {trailing}
    </button>
  )
}
