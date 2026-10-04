import { describe, expect, it } from 'vitest'
import { cycleInfo } from '@/domain/dosing/cycle'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import { cycleDecision, decisionKey } from './decision'

const d = (iso: string) => new Date(iso)
const W15 = [1, 2, 3, 4, 5]
const dosing = (doseMg: number, durationWeeks: number | null): ScheduleStep => ({
  doseMg,
  intervalDays: 1,
  weekdays: W15,
  durationWeeks,
})
const REST: ScheduleStep = { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 }

// 6 → 9 → 12 U for ten weeks, then four weeks of rest. Starts Monday Sep 21.
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: [dosing(0.1, 1), dosing(0.15, 1), dosing(0.2, 10), REST],
}
const info = (p: ProtocolLike, iso: string) => cycleInfo(p, d(iso))!
const decide = (iso: string, p: ProtocolLike = CJC, focused = false) =>
  cycleDecision(info(p, iso), d(iso), { focused })

describe('cycleDecision', () => {
  it('asks the day before a step-up, with the way to hold a week', () => {
    const dec = decide('2026-10-04T10:00')!
    expect(dec).toMatchObject({ kind: 'increase', timing: 'ahead', daysAway: 1, holdIndex: 1 })
    expect(dec.on).toEqual(d('2026-10-05T00:00'))
    expect(dec.from?.doseMg).toBe(0.15)
    expect(dec.to?.doseMg).toBe(0.2)
    expect(decisionKey('cjc', dec)).toBe('step:cjc:2')
  })

  it('does not ask far from the change, unless the notification was tapped', () => {
    expect(decide('2026-09-29T10:00')).toBeNull() // 6 days away
    expect(decide('2026-09-29T10:00', CJC, true)).toMatchObject({ kind: 'increase', daysAway: 6 })
  })

  it('asks from three days before and not earlier', () => {
    expect(decide('2026-10-01T10:00')).toBeNull() // 4 days away
    expect(decide('2026-10-02T10:00')).toMatchObject({ kind: 'increase', daysAway: 3 })
  })

  it('still asks on the day the step starts: the shot is that morning, and a hold goes back', () => {
    const dec = decide('2026-10-05T08:00')!
    expect(dec).toMatchObject({ kind: 'increase', timing: 'today', daysAway: 0, holdIndex: 1 })
    expect(dec.from?.index).toBe(1)
    expect(dec.to?.index).toBe(2)
    // Same key as the day before: dealing with it once covers both.
    expect(decisionKey('cjc', dec)).toBe('step:cjc:2')
    // Tomorrow it is history.
    expect(decide('2026-10-06T08:00')).toBeNull()
  })

  it('announces the end of the dosing weeks, which can be extended a week', () => {
    const ahead = decide('2026-12-12T10:00')! // step 3 ends Mon Dec 14
    expect(ahead).toMatchObject({ kind: 'rest', timing: 'ahead', daysAway: 2, holdIndex: 2 })
    expect(ahead.to?.pause).toBe(true)
    expect(decisionKey('cjc', ahead)).toBe('step:cjc:3')
    expect(decide('2026-12-14T09:00')).toMatchObject({
      kind: 'rest',
      timing: 'today',
      holdIndex: 2,
    })
  })

  it('announces the end of the cycle and then that it is over', () => {
    const ending = decide('2027-01-09T10:00')! // the rest ends Mon Jan 11
    expect(ending).toMatchObject({ kind: 'end', timing: 'ahead', daysAway: 2, to: null })
    expect(ending.from?.pause).toBe(true)
    expect(decisionKey('cjc', ending)).toBe('end:cjc:2027-01-11')

    const over = decide('2027-01-20T10:00')!
    expect(over).toMatchObject({ kind: 'finished', daysAway: 0, to: null, holdIndex: null })
    expect(decisionKey('cjc', over)).toBe('end:cjc:2027-01-11')
  })

  it('tells when a rest in the middle of a plan ends, with nothing to hold', () => {
    const plan: ProtocolLike = {
      ...CJC,
      steps: [dosing(0.1, 2), { ...REST, durationWeeks: 1 }, dosing(0.1, 4)],
    }
    // Rest is Oct 5–11; it ends Mon Oct 12.
    expect(decide('2026-10-10T10:00', plan)).toMatchObject({ kind: 'resume', holdIndex: null })
    expect(decide('2026-10-12T08:00', plan)).toMatchObject({ kind: 'resume', timing: 'today' })
  })

  it('has nothing to ask before the start, in maintenance or about a smaller or equal dose', () => {
    expect(decide('2026-09-14T10:00')).toBeNull()
    const open: ProtocolLike = { ...CJC, steps: [dosing(0.1, 1), dosing(0.2, null)] }
    expect(decide('2026-10-12T10:00', open)).toBeNull()
    const down: ProtocolLike = { ...CJC, steps: [dosing(0.2, 1), dosing(0.1, 1)] }
    expect(decide('2026-09-27T10:00', down)).toBeNull()
    const same: ProtocolLike = { ...CJC, steps: [dosing(0.2, 1), dosing(0.2, 1)] }
    expect(decide('2026-09-27T10:00', same)).toBeNull()
    expect(decide('2026-09-28T10:00', same)).toBeNull()
  })
})
