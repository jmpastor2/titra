import { describe, expect, it } from 'vitest'
import {
  MENU_GROUPS,
  MENU_ROUTES,
  menuBadges,
  type CycleGlance,
  type MenuId,
  type MenuState,
} from './menu'

const dosing = (over: Partial<CycleGlance> = {}): CycleGlance => ({
  phase: 'dosing',
  week: 4,
  doseWeek: 4,
  doseWeeks: 12,
  decisionDue: false,
  ...over,
})

const quiet: MenuState = {
  activeProtocols: 0,
  cycles: [],
  stock: { alerts: [], vials: 0 },
  remindersOn: false,
}

describe('menu structure', () => {
  it('lists every row exactly once and every row has a route', () => {
    const ids = MENU_GROUPS.flatMap((g) => g.items)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.toSorted()).toEqual((Object.keys(MENU_ROUTES) as MenuId[]).toSorted())
    expect(Object.values(MENU_ROUTES).every((r) => r.startsWith('/'))).toBe(true)
  })
})

describe('menuBadges', () => {
  it('says nothing about an empty account, apart from the reminders switch', () => {
    expect(menuBadges(quiet)).toEqual({ reminders: { tone: 'warn', key: 'more.badge.off' } })
  })

  it('counts active protocols and the vials in stock', () => {
    const b = menuBadges({ ...quiet, activeProtocols: 3, stock: { alerts: [], vials: 4 } })
    expect(b.protocols).toEqual({ tone: 'neutral', key: 'more.badge.active', values: { count: 3 } })
    expect(b.inventory).toEqual({ tone: 'neutral', key: 'more.badge.vials', values: { count: 4 } })
  })

  it('turns the inventory badge into a warning when stock needs attention', () => {
    const warn = menuBadges({
      ...quiet,
      stock: { alerts: [{ severity: 'warn' }, { severity: 'info' }], vials: 4 },
    })
    expect(warn.inventory).toEqual({ tone: 'warn', key: 'more.badge.alerts', values: { count: 1 } })
    const danger = menuBadges({
      ...quiet,
      stock: { alerts: [{ severity: 'warn' }, { severity: 'danger' }], vials: 4 },
    })
    expect(danger.inventory).toEqual({
      tone: 'danger',
      key: 'more.badge.alerts',
      values: { count: 2 },
    })
  })

  it('does not nag about info-level notes, and waits for stock to load', () => {
    const info = menuBadges({ ...quiet, stock: { alerts: [{ severity: 'info' }], vials: 2 } })
    expect(info.inventory?.key).toBe('more.badge.vials')
    expect(menuBadges({ ...quiet, stock: null }).inventory).toBeUndefined()
  })

  it('shows the week of the cycle, with its length when there is one', () => {
    expect(menuBadges({ ...quiet, cycles: [dosing()] }).cycles).toEqual({
      tone: 'neutral',
      key: 'more.badge.weekOf',
      values: { week: 4, total: 12 },
    })
    expect(menuBadges({ ...quiet, cycles: [dosing({ doseWeeks: null })] }).cycles).toEqual({
      tone: 'neutral',
      key: 'more.badge.week',
      values: { week: 4 },
    })
  })

  it('puts a pending decision before everything else', () => {
    const cycles = [dosing(), dosing({ decisionDue: true, week: 8, doseWeek: 8 })]
    expect(menuBadges({ ...quiet, cycles }).cycles).toEqual({
      tone: 'warn',
      key: 'more.badge.decide',
    })
  })

  it('prefers a dosing cycle over a rest or finished one, and names those phases', () => {
    const rest = dosing({ phase: 'rest', doseWeek: null })
    expect(menuBadges({ ...quiet, cycles: [rest, dosing()] }).cycles?.key).toBe('more.badge.weekOf')
    expect(menuBadges({ ...quiet, cycles: [rest] }).cycles?.key).toBe('more.badge.rest')
    expect(menuBadges({ ...quiet, cycles: [dosing({ phase: 'finished' })] }).cycles?.key).toBe(
      'more.badge.finished',
    )
    expect(menuBadges({ ...quiet, cycles: [dosing({ phase: 'before' })] }).cycles).toBeUndefined()
  })

  it('reports the reminders switch, and nothing until the profile has loaded', () => {
    expect(menuBadges({ ...quiet, remindersOn: true }).reminders).toEqual({
      tone: 'brand',
      key: 'more.badge.on',
    })
    expect(menuBadges({ ...quiet, remindersOn: null }).reminders).toBeUndefined()
  })
})
