import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { labAccount } from '@/features/exposure/testData'
import { useLastSevenDays } from './useLastSevenDays'

function week(now: Date) {
  const lab = labAccount(now)
  return renderHook(() => useLastSevenDays(lab.protocols, lab.doses, now)).result.current
}

describe('useLastSevenDays on the lab account', () => {
  it('on a Sunday evening: seven days ending today, all taken, the streak since the missed night', () => {
    const w = week(new Date(2026, 9, 4, 20, 30))
    expect(w.days).toHaveLength(7)
    expect(w.days.at(-1)?.day).toEqual(new Date(2026, 9, 4))
    expect(w.summary).toMatchObject({ planned: 9, taken: 9, missed: 0 })
    // Monday to Friday had doses; Saturday and Sunday are days off.
    expect(w.trail).toEqual(['done', 'done', 'done', 'done', 'done', 'rest', 'rest'])
    // The blend's missed night of 22 September is the last break: eight complete days since.
    expect(w.streak).toBe(8)
  })

  it('on Monday morning: the streak is cut by the missed night and today is still open', () => {
    const w = week(new Date(2026, 9, 5, 9, 20))
    expect(w.trail.at(-1)).toBe('open')
    expect(w.trail).toContain('broken')
    expect(w.streak).toBeLessThan(8)
  })

  it('has nothing to count without protocols', () => {
    const now = new Date(2026, 9, 4, 20, 30)
    const w = renderHook(() => useLastSevenDays([], [], now)).result.current
    expect(w.streak).toBe(0)
    expect(w.trail).toEqual(Array.from({ length: 7 }, () => 'rest'))
    expect(w.summary.planned).toBe(0)
  })
})
