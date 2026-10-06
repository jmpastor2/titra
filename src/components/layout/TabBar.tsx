import { clsx } from 'clsx'
import { BookOpen, FlaskConical, LineChart, ListChecks, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

/** Floating dock. The active tab is the only filled element in it; labels stay in sentence case so they read at a glance. */
export function TabBar() {
  const { t } = useTranslation()
  const items = [
    { to: '/', label: t('nav.today'), icon: FlaskConical, end: true },
    { to: '/log', label: t('nav.log'), icon: ListChecks },
    { to: '/progress', label: t('nav.progress'), icon: LineChart },
    { to: '/wiki', label: t('nav.wiki'), icon: BookOpen },
    { to: '/more', label: t('nav.more'), icon: MoreHorizontal },
  ]

  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around rounded-[26px] border border-line bg-panel/80 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[20px] py-1.5 text-[11px] font-semibold tracking-[0.01em] transition-colors active:scale-[0.97]',
                  isActive ? 'bg-panel-3 text-ink' : 'text-muted hover:text-ink-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx('size-[20px]')} strokeWidth={isActive ? 2.3 : 1.9} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
