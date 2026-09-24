import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  back,
  action,
  large = false,
}: {
  title: ReactNode
  /** Silkscreen label above the title. */
  eyebrow?: ReactNode
  subtitle?: ReactNode
  /** true → history back; string → navigate to path. */
  back?: boolean | string
  action?: ReactNode
  large?: boolean
}) {
  const nav = useNavigate()
  const { t } = useTranslation()
  return (
    <header className="safe-top sticky top-0 z-30 -mx-4 mb-4 bg-canvas/80 px-4 pb-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {back && (
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
            className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full border border-line bg-panel text-ink-2 hover:text-signal"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="spec mb-0.5">{eyebrow}</div>}
          <h1
            className={
              large
                ? 'truncate font-display text-[30px] font-bold leading-tight'
                : 'truncate font-display text-[21px] font-bold leading-tight'
            }
          >
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
