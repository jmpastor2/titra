import { clsx } from 'clsx'
import { ChevronRight, type LucideIcon } from 'lucide-react'

export interface ActionItem {
  key: string
  icon: LucideIcon
  title: string
  hint?: string
  tone?: 'danger'
  onClick: () => void
}

/**
 * The actions a sheet offers on one thing (a dose, a protocol): plain rows split by hairlines,
 * an icon, what it does and a line on what follows. The destructive one is the only red.
 */
export function ActionList({ items }: { items: readonly ActionItem[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map(({ key, icon: Icon, title, hint, tone, onClick }) => (
        <li key={key}>
          <button
            type="button"
            onClick={onClick}
            className="flex min-h-[60px] w-full items-center gap-3.5 py-2.5 text-left outline-none transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            <span
              className={clsx(
                'grid size-9 shrink-0 place-items-center rounded-full',
                tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-panel-2 text-ink-2',
              )}
            >
              <Icon aria-hidden className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={clsx(
                  'block text-[15px] font-semibold leading-snug',
                  tone === 'danger' && 'text-danger',
                )}
              >
                {title}
              </span>
              {hint && <span className="block text-[12.5px] leading-snug text-muted">{hint}</span>}
            </span>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
          </button>
        </li>
      ))}
    </ul>
  )
}
