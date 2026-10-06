import { describe, expect, it } from 'vitest'
import { toProtocolLike } from '@/data/mappers'
import { cycleInfo } from '@/domain/dosing/cycle'
import { cjc, reta } from './fixtures'
import { ladderSteps } from './ladder'
import { phaseWeeks, type PhaseWeek } from './phase'

const weeksOf = (row: ReturnType<typeof cjc>, now: string) => {
  const info = cycleInfo(toProtocolLike(row), new Date(now))
  if (!info) throw new Error('no cycle')
  return phaseWeeks(info, new Date(now))
}

const week = (state: PhaseWeek['state'], intensity: number, rest = false): PhaseWeek => ({
  key: `${state}${intensity}`,
  stepIndex: 0,
  kind: rest ? 'rest' : 'dose',
  n: rest ? null : 1,
  doseMg: intensity,
  intensity: rest ? 0 : intensity,
  state,
  open: false,
})

describe('ladderSteps', () => {
  it('draws a bar per week, rising with the dose, with today marked and the rest hatched', () => {
    const steps = ladderSteps(weeksOf(cjc(), '2026-10-05T10:00'))
    expect(steps).toHaveLength(16)
    expect(steps.map((s) => s.kind?.[0]).join('')).toBe('ddcppppppppprrrr')
    expect(steps[0]?.level).toBeCloseTo(0.5)
    expect(steps[1]?.level).toBeCloseTo(0.75)
    expect(steps[2]?.level).toBe(1)
    expect(steps[15]?.level).toBeLessThan(0.5)
  })

  it('keeps a titration that ends in maintenance climbing to its last dose', () => {
    const steps = ladderSteps(weeksOf(reta(), '2026-10-05T10:00'))
    const levels = steps.map((s) => s.level ?? 1)
    expect(levels).toEqual(levels.toSorted((a, b) => a - b))
    expect(steps.at(-1)?.level).toBe(1)
  })

  it('groups the weeks of a long plan so the bars stay readable', () => {
    const weeks = [
      ...Array.from({ length: 30 }, () => week('past', 0.5)),
      week('current', 1),
      ...Array.from({ length: 21 }, () => week('future', 1)),
      ...Array.from({ length: 8 }, () => week('future', 0, true)),
    ]
    const steps = ladderSteps(weeks, 20)
    expect(steps).toHaveLength(20)
    expect(steps.filter((s) => s.kind === 'current')).toHaveLength(1)
    expect(steps[0]).toEqual({ kind: 'done', level: 0.5 })
    expect(steps.at(-1)).toEqual({ kind: 'rest', level: 0.3 })
  })

  it('draws nothing for a plan with no weeks', () => {
    expect(ladderSteps([])).toEqual([])
  })
})
