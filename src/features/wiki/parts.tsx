import { clsx } from 'clsx'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { L10n } from '@/content/schema'

/** A small heading over a block of text inside a card or a fold. */
export function Section({
  title,
  tone,
  children,
}: {
  title: ReactNode
  tone?: 'danger' | 'warn'
  children: ReactNode
}) {
  return (
    <div>
      <h4
        className={clsx(
          'spec mb-1.5 flex items-center gap-1.5',
          tone === 'danger' && 'text-danger',
          tone === 'warn' && 'text-warn',
        )}
      >
        {title}
      </h4>
      <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
    </div>
  )
}

export function BulletList({ items, pick }: { items: L10n[]; pick: (l: L10n) => string }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.es} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-2">
          <span className="mt-[9px] size-1 shrink-0 rounded-full bg-muted" aria-hidden />
          <span className="min-w-0">{pick(item)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Figures as a definition grid: quiet label over a rounded number, no wells. */
export function FactGrid({
  items,
  columns = 2,
}: {
  items: readonly { label: string; value: string }[]
  columns?: 2 | 3
}) {
  return (
    <dl className={clsx('grid gap-x-4 gap-y-3', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="spec">{item.label}</dt>
          <dd className="readout mt-0.5 text-[17px] font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Past this many characters a text is folded to a few lines with a "read more". */
const CLAMP_FROM = 230

/** A paragraph that shows its first lines and opens on request, so a long summary does not bury the page. */
export function ClampedText({ text, className }: { text: string; className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const long = text.length > CLAMP_FROM
  return (
    <div>
      <p className={clsx('leading-relaxed', className, long && !open && 'line-clamp-4')}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="tap-link mt-1 text-[13px] font-semibold text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          {open ? t('wiki.less') : t('wiki.more')}
        </button>
      )}
    </div>
  )
}
