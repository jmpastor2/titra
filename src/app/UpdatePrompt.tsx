import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/Button'

/** Service-worker update banner. `registerType: 'prompt'` never reloads under the user. */
export function UpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('Service worker registration failed', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-20">
      <div className="fade-up flex items-center gap-3 rounded-full border border-line bg-panel px-4 py-2 shadow-lg">
        <span className="text-[13.5px]">{t('common.updateAvailable')}</span>
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          {t('common.update')}
        </Button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-[13px] text-muted"
          aria-label={t('common.close')}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
