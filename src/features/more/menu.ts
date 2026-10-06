import type { StockAlert } from '@/features/inventory/alerts'

/** Every row of the menu, by what it opens. */
export type MenuId =
  | 'protocols'
  | 'cycles'
  | 'inventory'
  | 'calculator'
  | 'simulator'
  | 'sites'
  | 'outlook'
  | 'reminders'
  | 'share'
  | 'export'
  | 'settings'

export interface MenuGroup {
  /** i18n key of the group's title. */
  title: string
  items: readonly MenuId[]
}

/** The menu as the person reads it: what is theirs, the tools, their health data, the app. */
export const MENU_GROUPS: readonly MenuGroup[] = [
  { title: 'more.groups.plan', items: ['protocols', 'cycles', 'inventory'] },
  { title: 'more.groups.tools', items: ['calculator', 'simulator', 'sites', 'outlook'] },
  { title: 'more.groups.health', items: ['reminders', 'share', 'export'] },
  { title: 'more.groups.app', items: ['settings'] },
]

export const MENU_ROUTES: Readonly<Record<MenuId, string>> = {
  protocols: '/protocols',
  cycles: '/cycles',
  inventory: '/inventory',
  calculator: '/calculator',
  simulator: '/simulator',
  sites: '/sites',
  outlook: '/outlook',
  reminders: '/reminders',
  share: '/share',
  export: '/export',
  settings: '/settings',
}

export type BadgeTone = 'neutral' | 'brand' | 'warn' | 'danger'

/** A live status next to a row: an i18n key (plural-aware through `count`) and its values. */
export interface MenuBadge {
  tone: BadgeTone
  key: string
  values?: Record<string, number>
}

/** What the cycle of one active protocol says, the part of `CycleInfo` the menu reads. */
export interface CycleGlance {
  phase: 'before' | 'dosing' | 'rest' | 'maintenance' | 'finished'
  week: number
  doseWeek: number | null
  doseWeeks: number | null
  decisionDue: boolean
}

export interface MenuState {
  activeProtocols: number
  cycles: readonly CycleGlance[]
  /** Null while the vials and doses are still loading. */
  stock: { alerts: readonly Pick<StockAlert, 'severity'>[]; vials: number } | null
  /** Null while the profile is still loading. */
  remindersOn: boolean | null
}

/** The cycle that deserves the badge: one waiting for a decision, else the first dosing one. */
function cycleBadge(cycles: readonly CycleGlance[]): MenuBadge | null {
  const due = cycles.find((c) => c.decisionDue)
  if (due) return { tone: 'warn', key: 'more.badge.decide' }
  const c = cycles.find((x) => x.phase === 'dosing' || x.phase === 'maintenance') ?? cycles[0]
  if (!c) return null
  if (c.phase === 'rest') return { tone: 'neutral', key: 'more.badge.rest' }
  if (c.phase === 'finished') return { tone: 'neutral', key: 'more.badge.finished' }
  if (c.phase === 'before') return null
  const week = c.doseWeek ?? c.week
  return c.doseWeeks
    ? { tone: 'neutral', key: 'more.badge.weekOf', values: { week, total: c.doseWeeks } }
    : { tone: 'neutral', key: 'more.badge.week', values: { week } }
}

function stockBadge(stock: NonNullable<MenuState['stock']>): MenuBadge | null {
  const urgent = stock.alerts.filter((a) => a.severity !== 'info')
  if (urgent.length > 0) {
    const tone = urgent.some((a) => a.severity === 'danger') ? 'danger' : 'warn'
    return { tone, key: 'more.badge.alerts', values: { count: urgent.length } }
  }
  return stock.vials > 0
    ? { tone: 'neutral', key: 'more.badge.vials', values: { count: stock.vials } }
    : null
}

/** The live badges of the rows that have one; the rest stay quiet. */
export function menuBadges(state: MenuState): Partial<Record<MenuId, MenuBadge>> {
  const out: Partial<Record<MenuId, MenuBadge>> = {}
  if (state.activeProtocols > 0) {
    out.protocols = {
      tone: 'neutral',
      key: 'more.badge.active',
      values: { count: state.activeProtocols },
    }
  }
  const cycle = cycleBadge(state.cycles)
  if (cycle) out.cycles = cycle
  const stock = state.stock ? stockBadge(state.stock) : null
  if (stock) out.inventory = stock
  if (state.remindersOn !== null) {
    out.reminders = state.remindersOn
      ? { tone: 'brand', key: 'more.badge.on' }
      : { tone: 'warn', key: 'more.badge.off' }
  }
  return out
}
