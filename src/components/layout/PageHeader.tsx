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
            className="-ml-1.5 grid size-11 shrink-0 place-items-center rounded-full bg-panel-2 text-ink outline-none hover:bg-panel-3 focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {/* A page reached with the back button already says where it is: no eyebrow there. */}
          {eyebrow && !back && <div className="spec mb-0.5">{eyebrow}</div>}
          <h1
            className={
              large
                ? 'break-words font-display text-[32px] font-bold leading-[1.1] tracking-[-0.03em]'
                : 'break-words font-display text-[22px] font-bold leading-tight tracking-[-0.025em]'
            }
          >
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 break-words text-[13px] text-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
