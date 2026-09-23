import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  padded?: boolean
  tone?: 'default' | 'brand' | 'warn' | 'danger' | 'accent'
}

const tones = {
  default: '',
  brand: 'border-brand/30 bg-[color-mix(in_oklab,var(--brand-soft)_55%,var(--surface))]',
  warn: 'border-warn/40 bg-[color-mix(in_oklab,var(--warn-soft)_60%,var(--surface))]',
  danger: 'border-danger/40 bg-[color-mix(in_oklab,var(--danger-soft)_60%,var(--surface))]',
  accent: 'border-accent/30 bg-[color-mix(in_oklab,var(--accent-soft)_55%,var(--surface))]',
}

export function Card({
  title,
  subtitle,
  action,
  padded = true,
  tone = 'default',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section className={clsx('card fade-up', tones[tone], padded && 'p-4', className)} {...rest}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
