import { clsx } from 'clsx'
import type { ReactNode } from 'react'

const TONE = { default: 'text-ink', signal: 'text-signal', warn: 'text-warn' } as const

export type FactTone = keyof typeof TONE

/**
 * A row of two or three figures under a card's headline, as a definition list: no boxes,
 * just a hairline above. Below 360 px a third figure takes a row of its own (`wide`), so
 * its caption has room to wrap.
 */
export function FactRow({
  children,
  count,
  bare = false,
  even = false,
}: {
  children: ReactNode
  count: number
  /** Inside a padded card, under its title: no hairline and no padding of its own. */
  bare?: boolean
  /** Three short figures that stay on one row in equal columns, even at 320 px. */
  even?: boolean
}) {
  if (count === 0) return null
  return (
    <dl
      className={clsx(
        'grid gap-y-3.5',
        even ? 'gap-x-3' : 'gap-x-4',
        !bare && 'border-t border-line px-4 py-3.5',
        count >= 3
          ? even
            ? 'grid-cols-3'
            : 'grid-cols-2 min-[360px]:grid-cols-[1fr_1fr_1.3fr]'
          : count === 2
            ? 'grid-cols-2'
            : 'grid-cols-1',
      )}
    >
      {children}
    </dl>
  )
}

/** One figure of a `FactRow`: a quiet label, the number with its unit and what it means. */
export function Fact({
  label,
  value,
  unit,
  caption,
  tone = 'default',
  icon,
  wide = false,
  small = false,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  caption?: ReactNode
  tone?: FactTone
  icon?: ReactNode
  /** The third of three: a row of its own below 360 px. */
  wide?: boolean
  /** The value is words or a dose list rather than one number: smaller, free to wrap. */
  small?: boolean
}) {
  return (
    <div className={clsx('min-w-0', wide && 'col-span-2 min-[360px]:col-span-1')}>
      <dt className="spec leading-snug">{label}</dt>
      <dd
        className={clsx(
          'readout mt-1 flex flex-wrap items-baseline gap-x-1 font-semibold',
          small ? 'text-[15px] leading-snug' : 'text-[21px] leading-none',
          TONE[tone],
        )}
      >
        {value}
        {unit && <span className="font-sans text-[12.5px] font-medium text-muted">{unit}</span>}
        {icon && <span className="self-center">{icon}</span>}
      </dd>
      {caption && (
        <dd className="mt-1.5 break-words text-[12px] leading-snug text-muted">{caption}</dd>
      )}
    </div>
  )
}
