import { useTranslation } from 'react-i18next'
import type { Blocker } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TextButton } from '@/features/doses/TextButton'

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
          <TextButton tone="danger" className="w-full" onClick={() => blocker.proceed()}>
            {t('protocols.guard.discard')}
          </TextButton>
        </div>
      }
    >
      {null}
    </Sheet>
  )
}
