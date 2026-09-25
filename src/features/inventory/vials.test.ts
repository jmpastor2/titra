import { describe, expect, it } from 'vitest'
import { vialRunway } from './vials'

const at = (d: number) => new Date(2026, 8, d, 9)

describe('vialRunway', () => {
  it('counts the doses a vial covers and when it runs out, across a step up', () => {
    // 4 mg left; 2 mg this week, then the titration moves to 4 mg.
    const r = vialRunway(4, [
      { at: at(25), doseMg: 2 },
      { at: at(32), doseMg: 4 },
    ])
    expect(r.doses).toBe(1)
    expect(r.runsOutAt).toEqual(at(32))
    expect(r.nextDoseMg).toBe(2)
  })

  it('covers every dose when there is enough', () => {
    const r = vialRunway(
      0.5,
      [0, 1, 2, 3, 4].map((i) => ({ at: at(25 + i), doseMg: 0.1 })),
    )
    expect(r.doses).toBe(5)
    expect(r.runsOutAt).toBeNull()
  })

  it('handles an empty schedule', () => {
    expect(vialRunway(3, [])).toEqual({ doses: 0, runsOutAt: null, nextDoseMg: null })
  })
})
