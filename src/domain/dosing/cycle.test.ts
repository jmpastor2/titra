import { describe, expect, it } from 'vitest'
import type { ProtocolLike, ScheduleStep } from '../types'
import { changeKind, cycleInfo, type CycleStep } from './cycle'
import { holdStep } from './stepEdit'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]

// 6 → 9 → 12 U of the CJC/ipamorelin blend, then four weeks of rest.
const CJC_STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: CJC_STEPS,
}
const RETA: ProtocolLike = {
  compoundId: 'retatrutide',
  startDate: '2026-09-07',
  times: ['09:00'],
  steps: [
    { doseMg: 1, intervalDays: 1, weekdays: [1], durationWeeks: 2 },
    { doseMg: 1.25, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
    { doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
    { doseMg: 1.75, intervalDays: 1, weekdays: [1], durationWeeks: 1 },
    { doseMg: 2.5, intervalDays: 1, weekdays: [1], durationWeeks: null },
  ],
}

describe('cycleInfo', () => {
  it('numbers the weeks and finds the next dose change (Sunday before a step-up)', () => {
    const c = cycleInfo(CJC, d('2026-10-04T10:00'))!
    expect(c.week).toBe(2) // Sep 28 – Oct 4
    expect(c.stepNumber).toBe(2)
    expect(c.doseWeek).toBe(2)
    expect(c.totalWeeks).toBe(16)
    expect(c.doseWeeks).toBe(12)
    expect(c.restWeeks).toBe(4)
    expect(c.phase).toBe('dosing')
    expect(c.next).toMatchObject({ kind: 'increase', doseMg: 0.2, daysAway: 1 })
    expect(c.next!.on).toEqual(d('2026-10-05T00:00'))
    expect(c.decisionDue).toBe(true)
  })

  it('does not ask for a decision far from the change', () => {
    const c = cycleInfo(CJC, d('2026-09-29T10:00'))!
    expect(c.next!.daysAway).toBe(6)
    expect(c.decisionDue).toBe(false)
  })

  it('counts only dosing weeks in "week N of M" and announces the rest', () => {
    const c = cycleInfo(CJC, d('2026-12-07T10:00'))! // Sep 21 + 11 weeks → week 12
    expect(c.week).toBe(12)
    expect(c.doseWeek).toBe(12)
    expect(c.next).toMatchObject({ kind: 'rest', daysAway: 7 })
    expect(c.decisionDue).toBe(false)

    const rest = cycleInfo(CJC, d('2026-12-16T10:00'))!
    expect(rest.phase).toBe('rest')
    expect(rest.doseWeek).toBeNull()
    expect(rest.week).toBe(13)
    expect(rest.next).toMatchObject({ kind: 'end', doseMg: null })

    expect(cycleInfo(CJC, d('2027-02-01T10:00'))!.phase).toBe('finished')
  })

  it('follows a titration to its open-ended maintenance step', () => {
    const wk4 = cycleInfo(RETA, d('2026-10-04T10:00'))!
    expect(wk4.week).toBe(4)
    expect(wk4.step!.doseMg).toBe(1.5)
    expect(wk4.stepNumber).toBe(3)
    expect(wk4.next).toMatchObject({ kind: 'increase', doseMg: 1.75, daysAway: 1 })
    expect(wk4.totalWeeks).toBeNull()

    const maint = cycleInfo(RETA, d('2026-11-30T10:00'))!
    expect(maint.phase).toBe('maintenance')
    expect(maint.next).toBeNull()
    expect(maint.fraction).toBeNull()
  })

  it('moves the next change back a week when a step is held', () => {
    const held: ProtocolLike = { ...CJC, steps: holdStep(CJC_STEPS, 1) }
    const c = cycleInfo(held, d('2026-10-04T10:00'))!
    expect(c.stepWeeks).toBe(2)
    expect(c.next).toMatchObject({ kind: 'increase', daysAway: 8 })
    expect(c.decisionDue).toBe(false)
  })

  it('knows a protocol that has not started yet', () => {
    const c = cycleInfo(CJC, d('2026-09-14T10:00'))!
    expect(c.phase).toBe('before')
    expect(c.week).toBe(0)
    expect(c.step).toBeNull()
    expect(c.next).toMatchObject({ daysAway: 7, doseMg: 0.1 })
    expect(c.decisionDue).toBe(false)
  })

  it('returns null for a protocol without steps', () => {
    expect(cycleInfo({ ...CJC, steps: [] }, d('2026-10-04T10:00'))).toBeNull()
  })
})

describe('changeKind', () => {
  const step = (doseMg: number, pause = false): CycleStep => ({
    index: 0,
    doseMg,
    pause,
    startsOn: d('2026-01-01'),
    endsOn: null,
    weeks: 1,
  })
  it('classifies the change from one step to the next', () => {
    expect(changeKind(step(1), step(1.5))).toBe('increase')
    expect(changeKind(step(1.5), step(1))).toBe('decrease')
    expect(changeKind(step(1), step(1))).toBe('same')
    expect(changeKind(step(1), step(0, true))).toBe('rest')
    expect(changeKind(step(0, true), step(1))).toBe('resume')
    expect(changeKind(step(1), undefined)).toBe('end')
    expect(changeKind(undefined, step(1))).toBe('increase')
  })
})
