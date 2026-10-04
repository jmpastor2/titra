import { useTranslation } from 'react-i18next'
import type { Blocker } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'

/** "You have unsaved changes": keep editing, or leave without them. */
export function UnsavedSheet({ blocker }: { blocker: Blocker }) {
  const { t } = useTranslation()
  if (blocker.state !== 'blocked') return null
  return (
    <Sheet
      open
      onClose={() => blocker.reset()}
      title={t('protocols.guard.title')}
      description={t('protocols.guard.body')}
      footer={
        <div className="flex flex-col gap-1.5 pb-1">
          <Button size="lg" block onClick={() => blocker.reset()}>
            {t('protocols.guard.stay')}
          </Button>
          <Button size="md" variant="danger" block onClick={() => blocker.proceed()}>
            {t('protocols.guard.discard')}
          </Button>
        </div>
      }
    >
      <div className="h-1" />
    </Sheet>
  )
}
