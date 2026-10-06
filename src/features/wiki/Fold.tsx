import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * A row that opens and closes, for a list of folds inside one card (the card draws the
 * dividers): the title and a quiet count always show, the long text stays folded until asked
 * for. Built on <details>, so it works without script, keyboard included.
 */
export function Fold({
  title,
  aside,
  defaultOpen = false,
  children,
}: {
  title: ReactNode
  /** A short readout next to the title, e.g. how many trials are inside. */
  aside?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details open={defaultOpen || undefined} className="group">
      <summary className="-mx-2 flex min-h-[54px] cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-3 outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60 [&::-webkit-details-marker]:hidden">
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{title}</h3>
        {aside !== undefined && (
          <span className="readout shrink-0 text-[13px] text-muted">{aside}</span>
        )}
        <ChevronDown
          className="size-4 shrink-0 text-muted transition group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="flex flex-col gap-4 pb-4 pt-1">{children}</div>
    </details>
  )
}
