import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

/** The app icon, the name and what it is for: the top of the sign-in and set-up screens. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  // On a screen with its own title the name is not the heading.
  const Name = compact ? 'p' : 'h1'
  return (
    <div
      className={clsx('flex', compact ? 'items-center gap-3' : 'flex-col items-center text-center')}
    >
      <img
        src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
        alt=""
        className={clsx(
          'shadow-[0_12px_28px_-14px_rgb(0_0_0/0.55)] ring-1 ring-line',
          compact ? 'size-10 rounded-[12px]' : 'size-[68px] rounded-[19px]',
        )}
      />
      <div className={compact ? 'min-w-0' : 'mt-5'}>
        <Name
          className={clsx(
            'font-display font-bold leading-none tracking-[-0.03em]',
            compact ? 'text-[17px]' : 'text-[34px]',
          )}
        >
          {t('app.name')}
        </Name>
        <p className={clsx('text-muted', compact ? 'mt-0.5 text-[12.5px]' : 'mt-2 text-[15px]')}>
          {t('app.tagline')}
        </p>
      </div>
    </div>
  )
}
