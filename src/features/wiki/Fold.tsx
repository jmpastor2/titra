import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * A card that opens and closes: the title (and a quiet count) always show, the long text stays
 * folded until asked for. Built on <details>, so it works without script, keyboard included.
 */
export function Fold({
  title,
  aside,
  defaultOpen = false,
  tone = 'default',
  children,
}: {
  title: ReactNode
  /** A short readout next to the title, e.g. how many trials are inside. */
  aside?: ReactNode
  defaultOpen?: boolean
  tone?: 'default' | 'warn'
  children: ReactNode
}) {
  return (
    <details
      open={defaultOpen || undefined}
      className={clsx(
        'card group fade-up',
        tone === 'warn' && 'border-warn/30 bg-[color-mix(in_oklab,var(--warn)_7%,var(--panel))]',
      )}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[inherit] px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-signal/60 [&::-webkit-details-marker]:hidden">
        <h3 className="min-w-0 flex-1 text-[15.5px] font-semibold leading-snug">{title}</h3>
        {aside !== undefined && <span className="spec shrink-0">{aside}</span>}
        <ChevronDown
          className="size-4 shrink-0 text-muted transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="flex flex-col gap-4 border-t border-line px-4 pb-4 pt-3.5">{children}</div>
    </details>
  )
}
