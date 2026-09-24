import { useTranslation } from 'react-i18next'

/** Shown when VITE_SUPABASE_* are missing. Developer-facing. */
export function SetupPage() {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-dvh place-items-center px-6 py-10">
      <div className="card w-full min-w-0 max-w-lg p-6">
        <h1 className="text-[22px] font-bold tracking-tight">{t('setup.title')}</h1>
        <p className="mt-2 text-[14px] text-ink-2">{t('setup.body')}</p>
        <pre className="mt-4 overflow-x-auto rounded-control bg-panel-2 p-3 text-[12.5px] leading-relaxed">
          {`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p className="mt-4 text-[13px] text-muted">{t('setup.steps')}</p>
      </div>
    </div>
  )
}
