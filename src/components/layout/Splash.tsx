import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'

export function Splash({ error }: { error?: string }) {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          className="size-16 rounded-2xl shadow-card"
        />
        <div>
          <div className="text-[22px] font-bold tracking-tight">{t('app.name')}</div>
          <div className="text-[13px] text-muted">{t('app.tagline')}</div>
        </div>
        {error ? (
          <>
            <p className="max-w-xs text-[13px] text-danger">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          </>
        ) : (
          <div className="mt-2 size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        )}
      </div>
    </div>
  )
}
