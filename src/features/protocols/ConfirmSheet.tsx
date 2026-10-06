import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'

/**
 * A themed confirmation: what is about to change in the body, a way out and the action.
 * Mounted open only while something is pending.
 */
export function ConfirmSheet({
  title,
  description,
  children,
  confirmLabel,
  tone = 'primary',
  busy = false,
  tall = false,
  onConfirm,
  onClose,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  busy?: boolean
  /** Fixed height, for a body that changes while it is used (a dose being typed). */
  tall?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      description={description}
      tall={tall}
      footer={
        <div className="flex flex-col gap-1.5 pb-1">
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="lg"
            block
            loading={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" size="md" block onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2 pt-1">{children}</div>
    </Sheet>
  )
}
