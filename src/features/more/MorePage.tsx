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

const ICON = 'size-[20px]'
const ICONS: Record<MenuId, ReactNode> = {
  protocols: <FlaskConical className={ICON} strokeWidth={1.75} />,
  cycles: <CalendarRange className={ICON} strokeWidth={1.75} />,
  inventory: <Package className={ICON} strokeWidth={1.75} />,
  calculator: <Calculator className={ICON} strokeWidth={1.75} />,
  simulator: <Sparkles className={ICON} strokeWidth={1.75} />,
  sites: <Target className={ICON} strokeWidth={1.75} />,
  outlook: <TrendingUp className={ICON} strokeWidth={1.75} />,
  reminders: <BellRing className={ICON} strokeWidth={1.75} />,
  share: <Share2 className={ICON} strokeWidth={1.75} />,
  export: <Download className={ICON} strokeWidth={1.75} />,
  settings: <Settings className={ICON} strokeWidth={1.75} />,
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
      <PageHeader title={t('more.title')} large />

      <div className="flex flex-col gap-6">
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

      <p className="readout mt-9 text-center text-[12.5px] font-medium text-muted">
        {t('app.name')} {env.appVersion}
      </p>
      <p className="mx-auto mt-2 max-w-[34ch] text-center text-[11.5px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>
    </div>
  )
}

/** A status worth seeing in colour (something to do) gets a tinted badge; facts stay plain text. */
function Status({ badge }: { badge: MenuBadge }) {
  const { t } = useTranslation()
  const text = t(badge.key, badge.values)
  if (badge.tone === 'neutral') {
    return <span className="shrink-0 text-[13px] text-muted">{text}</span>
  }
  return (
    <Badge tone={badge.tone} className="shrink-0">
      {text}
    </Badge>
  )
}

function MenuRow({ id, badge }: { id: MenuId; badge?: MenuBadge }) {
  const { t } = useTranslation()
  return (
    <Link
      to={MENU_ROUTES[id]}
      className="-mx-2 flex min-h-[64px] w-[calc(100%+1rem)] items-center gap-3.5 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <span aria-hidden className="grid w-6 shrink-0 place-items-center text-ink-2">
        {ICONS[id]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug">
          {t(`more.items.${id}`)}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
          {t(`more.hints.${id}`)}
        </span>
      </span>
      {badge && <Status badge={badge} />}
      <ChevronRight className="size-4 shrink-0 text-muted/70" aria-hidden />
    </Link>
  )
}
