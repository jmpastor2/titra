import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import type { DoseRow } from '@/data/database.types'
import { useUpdateDoses } from '@/data/hooks'
import type { PlannedDose } from '@/domain/dosing/schedule'
import { useLocale } from '@/lib/useLocale'
import { assignPatches, restorePatches } from './patches'
import { slotDayText } from './slotText'

/**
 * Make an administration cover a planned one ("era la del lun 29"): every row gets the
 * planned time, a free dose is linked to the protocol, and a toast offers to undo it.
 * Resolves to whether it was saved.
 */
export function useAssignDose(patientId: string) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { toast } = useToast()
  const { mutateAsync } = useUpdateDoses(patientId)

  return useCallback(
    async (rows: readonly DoseRow[], slot: PlannedDose, protocolId: string): Promise<boolean> => {
      try {
        await mutateAsync(assignPatches(rows, slot.at, protocolId))
      } catch {
        toast(t('common.error'), 'error')
        return false
      }
      toast(t('doses.assigned', { slot: slotDayText(slot, locale) }), 'success', {
        action: {
          label: t('doses.undo'),
          onAction: async () => {
            try {
              await mutateAsync(restorePatches(rows))
              toast(t('doses.undone'), 'info')
            } catch {
              toast(t('common.error'), 'error')
            }
          },
        },
      })
      return true
    },
    [mutateAsync, toast, t, locale],
  )
}
