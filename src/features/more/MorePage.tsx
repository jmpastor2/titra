import {
  BellRing,
  CalendarRange,
  Calculator,
  ChevronRight,
  Download,
  FlaskConical,
  Package,
  Settings,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/primitives'
import { useProtocols } from '@/data/hooks'
import { useCycleInfos } from '@/features/cycle/useCycleInfos'
import { useStock } from '@/features/inventory/useStock'
import { useReminderPrefs } from '@/features/reminders/useReminders'
import { env } from '@/lib/env'
import {
  MENU_GROUPS,
  MENU_ROUTES,
  menuBadges,
  type MenuBadge,
  type MenuId,
  type MenuState,
} from './menu'

const ICON = 'size-[18px]'
const ICONS: Record<MenuId, ReactNode> = {
  protocols: <FlaskConical className={ICON} />,
  cycles: <CalendarRange className={ICON} />,
  inventory: <Package className={ICON} />,
  calculator: <Calculator className={ICON} />,
  simulator: <Sparkles className={ICON} />,
  sites: <Target className={ICON} />,
  outlook: <TrendingUp className={ICON} />,
  reminders: <BellRing className={ICON} />,
  share: <Share2 className={ICON} />,
  export: <Download className={ICON} />,
  settings: <Settings className={ICON} />,
}

/**
 * The live state the badges read. All of it comes from queries the other screens already
 * share (protocols, vials, doses, the profile), so opening the menu costs no new request.
 */
function useMenuState(): MenuState {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const cycles = useCycleInfos()
  const stock = useStock(patientId)
  const reminders = useReminderPrefs()

  const active = useMemo(
    () => (protocols.data ?? []).filter((p) => p.status === 'active').length,
    [protocols.data],
  )
  const vials = useMemo(
    () => stock.list.filter((v) => !v.archived && Number(v.remaining_mg) > 0).length,
    [stock.list],
  )

  return {
    activeProtocols: active,
    cycles: cycles.map((c) => c.info),
    stock: stock.pending ? null : { alerts: stock.alerts, vials },
    remindersOn: reminders.loaded ? reminders.enabled : null,
  }
}

export function MorePage() {
  const { t } = useTranslation()
  const badges = menuBadges(useMenuState())

  return (
    <div>
      <PageHeader eyebrow={t('more.eyebrow')} title={t('more.title')} large />

      <div className="flex flex-col gap-5">
        {MENU_GROUPS.map((group) => (
          <section key={group.title} aria-label={t(group.title)}>
            <h2 className="spec mb-2 px-1">{t(group.title)}</h2>
            <Card padded={false} className="px-4">
              <ul className="divide-y divide-line">
                {group.items.map((id) => (
                  <li key={id}>
                    <MenuRow id={id} badge={badges[id]} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>

      <p className="spec mt-8 text-center">TITRA · {env.appVersion}</p>
      <p className="mt-2 px-2 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>
    </div>
  )
}

function MenuRow({ id, badge }: { id: MenuId; badge?: MenuBadge }) {
  const { t } = useTranslation()
  return (
    <Link
      to={MENU_ROUTES[id]}
      className="-mx-2 flex min-h-[68px] w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-[14px] border border-signal/20 bg-signal-soft text-signal"
      >
        {ICONS[id]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 text-[15px] font-semibold leading-snug">
            {t(`more.items.${id}`)}
          </span>
          {badge && (
            <Badge tone={badge.tone} className="shrink-0">
              {t(badge.key, badge.values)}
            </Badge>
          )}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
          {t(`more.hints.${id}`)}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
    </Link>
  )
}
