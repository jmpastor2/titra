import { clsx } from 'clsx'
import { Archive, CopyPlus, FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * What to do with a vial: reconstitute it when it is powder, add another like it, archive it.
 * Plain labelled buttons, at least 44 px tall.
 */
export function VialActions({
  label,
  powder,
  onReconstitute,
  onAddSame,
  onArchive,
}: {
  /** The vial's label, so each button says which vial it is for. */
  label: string
  powder: boolean
  onReconstitute: () => void
  onAddSame: () => void
  onArchive: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="border-t border-line">
      {powder && (
        <button
          type="button"
          onClick={onReconstitute}
          className="flex h-12 w-full items-center justify-center gap-2 bg-signal-soft text-[14px] font-semibold text-signal outline-none transition active:brightness-110 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/60"
        >
          <FlaskConical className="size-4" aria-hidden />
          {t('reconstitute.button')}
        </button>
      )}
      <div
        className={clsx('grid grid-cols-2 divide-x divide-line', powder && 'border-t border-line')}
      >
        <Action
          icon={<CopyPlus className="size-4" aria-hidden />}
          label={t('inventory.addSame')}
          ariaLabel={t('inventory.addSameAria', { label })}
          onClick={onAddSame}
        />
        <Action
          icon={<Archive className="size-4" aria-hidden />}
          label={t('inventory.archive')}
          ariaLabel={t('inventory.archiveAria', { label })}
          onClick={onArchive}
        />
      </div>
    </div>
  )
}

function Action({
  icon,
  label,
  ariaLabel,
  onClick,
}: {
  icon: ReactNode
  label: string
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex h-11 items-center justify-center gap-1.5 text-[13px] font-semibold text-ink-2 outline-none transition hover:bg-panel-2 active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/60"
    >
      {icon}
      {label}
    </button>
  )
}
