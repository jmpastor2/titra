import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'

/** Something that was just done and can be taken back. */
export interface UndoOffer {
  message: string
  onUndo: () => Promise<void> | void
}

export interface UndoState {
  /** Say what was done and offer the way back ("Deshacer") in the app's toast. */
  show: (offer: UndoOffer) => void
}

/**
 * The way back for protocol changes. The toast lives with the app, not the card that made it
 * (an archived protocol moves to another list, which remounts its card).
 */
export function useUndoOffer(): UndoState {
  const { t } = useTranslation()
  const { toast } = useToast()
  return useMemo(
    () => ({
      show: ({ message, onUndo }: UndoOffer) =>
        toast(message, 'success', {
          action: {
            label: t('protocolMenu.undo'),
            onAction: async () => {
              try {
                await onUndo()
              } catch {
                toast(t('common.error'), 'error')
              }
            },
          },
        }),
    }),
    [toast, t],
  )
}
