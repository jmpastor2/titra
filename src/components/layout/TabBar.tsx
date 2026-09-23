import { clsx } from 'clsx'
import { Activity, BookOpen, Home, MoreHorizontal, Syringe, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import type { UserRole } from '@/data/database.types'

export function TabBar({ role }: { role: UserRole }) {
  const { t } = useTranslation()
  const items =
    role === 'clinician'
      ? [
          { to: '/', label: t('nav.patients'), icon: Users, end: true },
          { to: '/wiki', label: t('nav.wiki'), icon: BookOpen },
          { to: '/more', label: t('nav.more'), icon: MoreHorizontal },
        ]
      : [
          { to: '/', label: t('nav.home'), icon: Home, end: true },
          { to: '/log', label: t('nav.log'), icon: Syringe },
          { to: '/health', label: t('nav.health'), icon: Activity },
          { to: '/wiki', label: t('nav.wiki'), icon: BookOpen },
          { to: '/more', label: t('nav.more'), icon: MoreHorizontal },
        ]

  return (
    <nav
      aria-label="Principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 pb-1 pt-2 text-[10.5px] font-medium transition-colors',
                  isActive ? 'text-brand-strong' : 'text-muted hover:text-ink-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-brand-soft',
                    )}
                  >
                    <Icon className="size-[21px]" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
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
