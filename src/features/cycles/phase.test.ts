import { describe, expect, it } from 'vitest'
import { cycleInfo } from '@/domain/dosing/cycle'
import { toProtocolLike } from '@/data/mappers'
import { cjc, mots, reta } from './fixtures'
import { focusStep, phaseWeeks } from './phase'

const weeksOf = (row: ReturnType<typeof cjc>, now: string) => {
  const info = cycleInfo(toProtocolLike(row), new Date(now))!
  return phaseWeeks(info, new Date(now))
}

describe('phaseWeeks', () => {
  // The blend: 1 + 1 + 10 dosing weeks and 4 of rest, started Monday 21 Sep.
  it('has a cell for every week of the cycle, the rest included', () => {
    const w = weeksOf(cjc(), '2026-10-05T10:00')
    expect(w).toHaveLength(16)
    expect(w.filter((c) => c.kind === 'rest')).toHaveLength(4)
  })

  it('numbers only the weeks with a dose, as "week 3 of 12" does', () => {
    const w = weeksOf(cjc(), '2026-10-05T10:00')
    expect(w.slice(0, 3).map((c) => c.n)).toEqual([1, 2, 3])
    expect(w[11]?.n).toBe(12)
    expect(w.slice(12).map((c) => c.n)).toEqual([null, null, null, null])
  })

  it('marks what is behind, today and ahead', () => {
    const w = weeksOf(cjc(), '2026-10-05T10:00')
    expect(w.map((c) => c.state[0]).join('')).toBe('ppcfffffffffffff')
    // The week ends on Sunday night, the next one starts on Monday.
    expect(weeksOf(cjc(), '2026-10-04T23:00')[1]?.state).toBe('current')
  })

  it('shades the dose against the largest of the cycle, and gives a rest none', () => {
    const w = weeksOf(cjc(), '2026-10-05T10:00')
    const [a, b, c] = w.map((x) => x.intensity)
    expect(a).toBeCloseTo(0.5)
    expect(b).toBeCloseTo(0.75)
    expect(c).toBe(1)
    expect(w[15]?.intensity).toBe(0)
  })

  it('draws an open-ended step as two weeks, the last one fading', () => {
    // Retatrutide: 2 + 1 + 1 + 1 weeks, then maintenance with no end.
    const w = weeksOf(reta(), '2026-10-05T10:00')
    expect(w).toHaveLength(7)
    expect(w.map((c) => c.open)).toEqual([false, false, false, false, false, false, true])
    expect(w[5]?.open).toBe(false)
  })

  it('puts today on the last drawn week once maintenance has gone on longer than that', () => {
    // 6 Nov: week 8 of a cycle that started 14 Sep, long into the open step.
    const w = weeksOf(reta(), '2026-11-09T10:00')
    expect(w.filter((c) => c.state === 'current')).toHaveLength(1)
    expect(w.at(-1)?.state).toBe('current')
    expect(w.at(-2)?.state).toBe('past')
  })

  it('marks everything as ahead before the cycle starts', () => {
    expect(weeksOf(mots(), '2026-09-01T10:00').every((c) => c.state === 'future')).toBe(true)
  })
})

describe('focusStep', () => {
  const at = (row: ReturnType<typeof cjc>, now: string) =>
    focusStep(cycleInfo(toProtocolLike(row), new Date(now))!, new Date(now))

  it('is the step in force, the next one before the start and the last one after the end', () => {
    expect(at(cjc(), '2026-10-05T10:00')).toBe(2)
    expect(at(cjc(), '2026-09-01T10:00')).toBe(0)
    expect(at(cjc(), '2027-03-01T10:00')).toBe(3)
  })
})
