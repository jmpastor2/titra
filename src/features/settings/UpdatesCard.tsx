import { CircleCheck, CircleX, Download, Info, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/primitives'
import { env } from '@/lib/env'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useAppUpdate } from './useAppUpdate'
import { splitVersion } from './version'

/**
 * Settings → version and updates: which build this is and a way to look for a newer one
 * right now. The result is written below the button, so nothing moves when it arrives.
 */
export function UpdatesCard() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { phase, checkedAt, applying, check, apply } = useAppUpdate()
  const { version, build } = splitVersion(env.appVersion)
  const checking = phase === 'checking'

  return (
    <Card title={t('settings.updates.title')} subtitle={t('settings.updates.hint')}>
      <div className="flex flex-col gap-3.5">
        <dl className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
          <dt className="spec">{t('settings.updates.version')}</dt>
          <dd className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <span className="readout text-[17px] font-semibold leading-none">{version}</span>
            {build && (
              <span className="readout break-all text-[12.5px] text-muted">
                {t('settings.updates.build', { build })}
              </span>
            )}
            {env.isDev && <Badge>{t('settings.updates.dev')}</Badge>}
          </dd>
        </dl>

        {phase !== 'unsupported' &&
          (phase === 'available' ? (
            <Button
              block
              leading={<Download className="size-4" />}
              loading={applying}
              onClick={() => void apply()}
            >
              {applying ? t('settings.updates.applying') : t('settings.updates.apply')}
            </Button>
          ) : (
            <Button
              block
              variant="secondary"
              leading={<RefreshCw className="size-4" />}
              loading={checking}
              onClick={() => void check()}
            >
              {checking ? t('settings.updates.checking') : t('settings.updates.check')}
            </Button>
          ))}

        <div aria-live="polite" className="text-[13px] leading-snug">
          {phase === 'upToDate' && (
            <p className="flex items-center gap-2 font-medium text-ok">
              <CircleCheck className="size-4 shrink-0" aria-hidden />
              <span>
                {t('settings.updates.upToDate')}
                {checkedAt && (
                  <span className="font-normal text-muted">
                    {' · '}
                    {t('settings.updates.checkedAt', {
                      time: fmtDate(checkedAt, locale, locale === 'es' ? 'HH:mm' : 'h:mm a'),
                    })}
                  </span>
                )}
              </span>
            </p>
          )}
          {phase === 'available' && (
            <p className="flex items-center gap-2 font-medium text-signal">
              <Download className="size-4 shrink-0" aria-hidden />
              {t('settings.updates.available')}
            </p>
          )}
          {phase === 'error' && (
            <p role="alert" className="flex items-start gap-2 text-danger">
              <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('settings.updates.error')}
            </p>
          )}
          {phase === 'unsupported' && (
            <p className="flex items-start gap-2 text-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('settings.updates.unsupported')}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
