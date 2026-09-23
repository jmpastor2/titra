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
  primary:
    'bg-brand text-white hover:bg-brand-strong active:scale-[0.98] disabled:bg-surface-3 disabled:text-muted shadow-sm',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-2 active:scale-[0.98] disabled:text-muted',
  soft: 'bg-brand-soft text-brand-strong hover:brightness-95 active:scale-[0.98] disabled:opacity-60',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2 active:scale-[0.98] disabled:text-muted',
  danger: 'bg-danger text-white hover:brightness-95 active:scale-[0.98] disabled:opacity-60',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-[10px]',
  md: 'h-11 px-4 text-[15px] gap-2 rounded-control',
  lg: 'h-13 px-5 text-base gap-2 rounded-control',
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
        'inline-flex items-center justify-center font-semibold transition-[transform,background-color,color] duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed',
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
