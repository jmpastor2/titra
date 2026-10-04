import { describe, expect, it } from 'vitest'
import { fmtAgo } from './relative'

describe('fmtAgo', () => {
  const now = new Date(2026, 9, 7, 12)
  it('is relative to the clock it is given', () => {
    expect(fmtAgo(new Date(2026, 9, 5, 9), now, 'es', 'ahora')).toBe('hace 2 días')
    expect(fmtAgo(new Date(2026, 9, 5, 9), now, 'en', 'just now')).toBe('2 days ago')
    expect(fmtAgo(new Date(2026, 9, 7, 9), now, 'es', 'ahora')).toBe('hace 3 horas')
  })
  it('says "just now" for the dose that was logged a moment ago, never "0 seconds ago"', () => {
    expect(fmtAgo(new Date(now.getTime() - 20_000), now, 'es', 'ahora mismo')).toBe('ahora mismo')
    expect(fmtAgo(now, now, 'en', 'just now')).toBe('just now')
    expect(fmtAgo(new Date(now.getTime() - 61_000), now, 'es', 'ahora mismo')).toBe('hace 1 minuto')
  })
  it('reads a date ahead as ahead', () => {
    expect(fmtAgo(new Date(2026, 9, 9, 12), now, 'en', 'just now')).toBe('in 2 days')
  })
})
