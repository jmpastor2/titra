import { clsx } from 'clsx'
import { Archive, ArchiveRestore, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Vial } from '@/components/ui/primitives'
import type { InventoryRow } from '@/data/database.types'
import { useLocale } from '@/lib/useLocale'
import { fmtMg } from './vialFormat'
import { vialLook } from './vials'

/**
 * Vials that are done with: empty ones still to be archived, and archived ones, which
 * can be restored. Collapsed: it is history, not the day-to-day.
 */
export function FinishedVials({
  vials,
  readOnly,
  onArchive,
  onRestore,
}: {
  vials: readonly InventoryRow[]
  readOnly: boolean
  onArchive: (vial: InventoryRow) => void
  onRestore: (vial: InventoryRow) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  if (vials.length === 0) return null

  return (
    <section className="mt-4" aria-label={t('inventory.finished')}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
      >
        <span className="spec">{t('inventory.finishedCount', { count: vials.length })}</span>
        <ChevronDown
          className={clsx('size-4 text-muted transition', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && (
        <ul className="card divide-y divide-line px-4">
          {vials.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3">
              <Vial {...vialLook(v)} size={38} className="opacity-60" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{v.label}</span>
                <span className="readout block truncate text-[11.5px] text-muted">
                  {v.archived ? t('inventory.archived') : t('inventory.statusFinished')} ·{' '}
                  {fmtMg(Number(v.remaining_mg), locale)}
                </span>
              </span>
              {!readOnly &&
                (v.archived ? (
                  <button
                    type="button"
                    aria-label={t('inventory.restoreAria', { label: v.label })}
                    onClick={() => onRestore(v)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-signal outline-none transition hover:bg-signal-soft active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    <ArchiveRestore className="size-4" aria-hidden />
                    {t('inventory.restore')}
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={t('inventory.archiveAria', { label: v.label })}
                    onClick={() => onArchive(v)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ink-2 outline-none transition hover:bg-panel-2 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    <Archive className="size-4" aria-hidden />
                    {t('inventory.archive')}
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
