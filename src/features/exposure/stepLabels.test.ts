import { describe, expect, it } from 'vitest'
import { stepLabel, stepPriority } from './stepLabels'

describe('stepLabel', () => {
  it('writes the dose in the unit the compound is dosed in, with the direction of the change', () => {
    expect(stepLabel({ kind: 'up', doseMg: 1.5 }, 'mg', 'es', 'Pausa')).toBe('↑ 1,5 mg')
    expect(stepLabel({ kind: 'down', doseMg: 0.1 }, 'mcg', 'es', 'Pausa')).toBe('↓ 100 mcg')
    expect(stepLabel({ kind: 'start', doseMg: 1 }, 'mg', 'en', 'Pause')).toBe('▸ 1 mg')
    expect(stepLabel({ kind: 'resume', doseMg: 2 }, 'mg', 'es', 'Pausa')).toBe('▸ 2 mg')
    expect(stepLabel({ kind: 'pause', doseMg: 0 }, 'mg', 'es', 'Pausa')).toBe('Pausa')
  })
})

describe('stepPriority', () => {
  const day = 86_400_000
  const steps = [0, 14 * day, 28 * day, 35 * day, 42 * day]
  const now = 30 * day
  it('keeps the step in force first, then the ones to come, then the older ones', () => {
    const p = steps.map((t) => stepPriority(t, now, steps))
    // 0 and 14 d are old, 28 d is in force, 35 d and 42 d are ahead.
    expect(p).toEqual([3, 3, 7, 5, 5])
  })
  it('has no step in force before the first one', () => {
    expect(steps.map((t) => stepPriority(t, -day, steps))).toEqual([5, 5, 5, 5, 5])
  })
})
