import { describe, expect, it } from 'vitest'
import type { StockAlert } from '@/features/inventory/alerts'
import { isUrgent, urgentStock } from './urgentStock'

const alert = (over: Partial<StockAlert>): StockAlert => ({
  kind: 'expiresSoon',
  severity: 'warn',
  compoundIds: ['retatrutide'],
  ...over,
})

describe('isUrgent', () => {
  it('is an expiry today or tomorrow, an empty vial or one to reconstitute', () => {
    expect(isUrgent(alert({ kind: 'expiresSoon', days: 1 }))).toBe(true)
    expect(isUrgent(alert({ kind: 'expiresSoon', days: 0 }))).toBe(true)
    expect(isUrgent(alert({ kind: 'expired', days: -2 }))).toBe(true)
    expect(isUrgent(alert({ kind: 'runsOut', doses: 1 }))).toBe(true)
    expect(isUrgent(alert({ kind: 'reconstitute', doses: 0 }))).toBe(true)
  })

  it('leaves out what can wait, and the reorder the Stock tile already says', () => {
    expect(isUrgent(alert({ kind: 'expiresSoon', days: 5 }))).toBe(false)
    expect(isUrgent(alert({ kind: 'reorder', severity: 'danger', days: 8 }))).toBe(false)
    expect(isUrgent(alert({ kind: 'leftover', severity: 'info' }))).toBe(false)
    expect(isUrgent(alert({ kind: 'expiresBeforeEmpty', severity: 'info', days: 12 }))).toBe(false)
  })
})

describe('urgentStock', () => {
  it('takes the first urgent one and counts the others', () => {
    const found = urgentStock([
      alert({ kind: 'reorder', severity: 'danger', days: 8 }),
      alert({ kind: 'reconstitute', severity: 'danger', compoundIds: ['mots-c'], doses: 0 }),
      alert({ kind: 'expiresSoon', days: 1 }),
    ])
    expect(found?.alert.kind).toBe('reconstitute')
    expect(found?.more).toBe(1)
  })

  it('is nothing when nothing is urgent', () => {
    expect(urgentStock([alert({ kind: 'expiresSoon', days: 6 })])).toBeNull()
    expect(urgentStock([])).toBeNull()
  })
})
