import { clsx } from 'clsx'
import { BookOpen, FlaskConical, LineChart, ListChecks, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

/** Floating dock. The active tab is the only luminous element in it. */
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
      <ul className="mx-auto flex max-w-md items-stretch justify-around rounded-[26px] border border-line-strong bg-panel/85 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 rounded-[20px] py-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  isActive ? 'bg-signal-soft text-signal' : 'text-muted hover:text-ink-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx(
                      'size-[20px]',
                      isActive && 'drop-shadow-[0_0_6px_var(--signal)]',
                    )}
                    strokeWidth={isActive ? 2.3 : 1.9}
                  />
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
