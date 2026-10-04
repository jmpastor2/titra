import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import { useQuickWrites, type NewMeasurement } from './data'

/**
 * Saves measurements the way every quick entry should: on screen at once, a toast that says
 * so and offers "Deshacer" for a few seconds, and an error toast if the server refuses.
 * The caller closes its sheet; nothing here waits for the network.
 */
export function useQuickSave(patientId: string) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const writes = useQuickWrites(patientId)

  const save = useCallback(
    (inputs: readonly NewMeasurement[], message: string, undoLabel?: string) => {
      const fail = () => toast(t('common.error'), 'error')
      void writes
        .addMany(inputs)
        .then(({ rows, saved }) => {
          toast(message, 'success', {
            action: {
              label: undoLabel ?? t('quick.counter.undo'),
              onAction: () => writes.removeMany(rows).catch(fail),
            },
          })
          return saved
        })
        .catch(fail)
    },
    [writes, toast, t],
  )

  return { save, writes }
}
