import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { InventoryRow } from '@/data/database.types'
import { useReconstituteSheet } from './useReconstituteSheet'

/**
 * Where a dose would read in syringe units but its vial is still powder: say so, and open
 * the reconstitution right there. Once the water is saved the units appear on their own.
 */
export function ReconstituteNudge({ vial, className }: { vial: InventoryRow; className?: string }) {
  const { t } = useTranslation()
  const { reconstitute, sheet } = useReconstituteSheet()
  return (
    <div className={clsx('flex items-center justify-between gap-3', className)}>
      <p className="min-w-0 text-[12.5px] leading-snug text-muted">
        {t('reconstitute.nudge', { vial: vial.label })}
      </p>
      <button
        type="button"
        onClick={() => reconstitute(vial)}
        className="min-h-11 shrink-0 rounded-full bg-signal-soft px-3.5 text-[13px] font-semibold text-signal"
      >
        {t('reconstitute.button')}
      </button>
      {sheet}
    </div>
  )
}
