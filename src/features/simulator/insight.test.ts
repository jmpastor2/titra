import { describe, expect, it } from 'vitest'
import { lowestLevel, scenarioInsight } from './insight'

const at = (d: number) => new Date(2026, 9, d)
const pk = { halfLifeH: 144, tmaxH: 36 }

describe('lowestLevel', () => {
  it('is the lowest point of the curve, null for none', () => {
    expect(
      lowestLevel([
        { at: at(1), mg: 0.9 },
        { at: at(2), mg: 0.4 },
        { at: at(3), mg: 1.2 },
      ]),
    ).toBe(0.4)
    expect(lowestLevel([])).toBeNull()
  })
})

describe('scenarioInsight', () => {
  const plan = [
    { at: at(1), mg: 0.9 },
    { at: at(8), mg: 1.1 },
  ]
  const skip = [
    { at: at(1), mg: 0.9 },
    { at: at(15), mg: 0.45 },
  ]

  it('compares the lowest level after a skipped dose with the plan', () => {
    expect(scenarioInsight('skip_next', pk, plan, skip)).toEqual({
      kind: 'skip',
      lowestMg: 0.45,
      planLowestMg: 0.9,
    })
  })
  it('gives the washout of stopping, a tenth of what is on board', () => {
    const stop = scenarioInsight('stop', pk, plan, null)
    expect(stop?.kind).toBe('stop')
    // 144 h half-life: ln(10)/ke = 144 * log2(10) ≈ 478 h.
    expect(stop && stop.kind === 'stop' ? stop.washoutH : 0).toBeCloseTo(478.3, 0)
  })
  it('has nothing to say for the other tabs or without a scenario curve', () => {
    expect(scenarioInsight('planned', pk, plan, null)).toBeNull()
    expect(scenarioInsight('switch', pk, plan, skip)).toBeNull()
    expect(scenarioInsight('skip_next', pk, plan, null)).toBeNull()
    expect(scenarioInsight('skip_next', pk, [], skip)).toBeNull()
  })
})
