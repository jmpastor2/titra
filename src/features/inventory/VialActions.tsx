import { Archive, CopyPlus, FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

/**
 * What to do with a vial: reconstitute it when it is powder (its one real next step, a soft
 * button), then add another like it or archive it, as quiet text buttons at the foot.
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
    <>
      {powder && (
        <div className="px-4 pb-4">
          <Button
            variant="soft"
            block
            leading={<FlaskConical className="size-4" aria-hidden />}
            onClick={onReconstitute}
          >
            {t('reconstitute.button')}
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
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
    </>
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
      className="flex min-h-11 items-center justify-center gap-1.5 px-2 text-center text-[13px] font-medium leading-tight text-muted outline-none transition hover:bg-panel-2 hover:text-ink active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/60"
    >
      {icon}
      {label}
    </button>
  )
}
