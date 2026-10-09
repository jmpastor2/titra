import { describe, expect, it } from 'vitest'
import { toProtocolLike } from '@/data/mappers'
import type { ScheduleStep } from '@/domain/types'
import { cjc, CJC_STEPS, protocolRow, reta } from './fixtures'
import { buildCycleViews } from './model'
import {
  restGuide,
  adjustRest,
  buildNextCycle,
  closesOnNewCycle,
  isStartDate,
  MAX_REST_WEEKS,
  nextCycleLike,
  nextCycleSteps,
  nextMonday,
  startChoices,
  stepsUpdate,
  trailingRest,
} from './newCycle'
import { cycleInfo } from '@/domain/dosing/cycle'

const d = (iso: string) => new Date(iso)
const NOW = d('2027-01-12T10:00') // the day after the CJC plan (and its rest) ended

describe('nextMonday', () => {
  it('is today when today is a Monday, else the Monday that follows', () => {
    expect(nextMonday(d('2026-10-05T18:30'))).toEqual(d('2026-10-05T00:00'))
    expect(nextMonday(d('2026-10-06T08:00'))).toEqual(d('2026-10-12T00:00'))
    expect(nextMonday(d('2026-10-10T08:00'))).toEqual(d('2026-10-12T00:00'))
    expect(nextMonday(d('2026-10-11T23:59'))).toEqual(d('2026-10-12T00:00'))
  })
})

describe('isStartDate', () => {
  it('accepts a real yyyy-MM-dd date only', () => {
    expect(isStartDate('2026-10-12')).toBe(true)
    expect(isStartDate('2026-13-45')).toBe(false)
    expect(isStartDate('12/10/2026')).toBe(false)
    expect(isStartDate('')).toBe(false)
  })
})

describe('startChoices', () => {
  it('offers every dosing step, flagging the first and where the cycle was left', () => {
    const [view] = buildCycleViews([cjc()], NOW)
    expect(startChoices(view!, NOW)).toEqual([
      { stepIndex: 0, doseMg: 0.1, first: true, leftOff: false },
      { stepIndex: 1, doseMg: 0.15, first: false, leftOff: false },
      { stepIndex: 2, doseMg: 0.2, first: false, leftOff: true },
    ])
  })

  it('leaves off at the step a closed cycle had reached', () => {
    const now = d('2026-10-05T10:00')
    const [view] = buildCycleViews(
      [cjc({ status: 'completed', updated_at: d('2026-10-02T15:00').toISOString() })],
      now,
    )
    expect(startChoices(view!, now).map((c) => c.leftOff)).toEqual([false, true, false])
  })

  it('is both the first and the last of a plan with a single dose', () => {
    const only = cjc({
      steps: [{ doseMg: 0.1, intervalDays: 1, durationWeeks: 8 }] as unknown as never,
    })
    const [view] = buildCycleViews([only], NOW)
    expect(startChoices(view!, NOW)).toEqual([
      { stepIndex: 0, doseMg: 0.1, first: true, leftOff: true },
    ])
  })
})

describe('nextCycleSteps', () => {
  it('copies the plan from the chosen step on', () => {
    const steps = nextCycleSteps(CJC_STEPS, 2)
    expect(steps.map((s) => s.doseMg)).toEqual([0.2, 0])
    expect(steps[1]).toMatchObject({ pause: true, durationWeeks: 4, label: 'Descanso' })
  })

  it('shares nothing with the plan it copies', () => {
    const steps = nextCycleSteps(CJC_STEPS, 0)
    steps[0]!.weekdays!.push(6)
    steps[0]!.doseMg = 9
    expect(CJC_STEPS[0]!.weekdays).toEqual([1, 2, 3, 4, 5])
    expect(CJC_STEPS[0]!.doseMg).toBe(0.1)
  })
})

describe('buildNextCycle', () => {
  const previous = cjc({ created_by: 'someone-else', template_id: 'tpl-1', notes: 'En ayunas' })

  it('writes the fields the protocol editor writes, copied from the previous protocol', () => {
    const row = buildNextCycle({ previous, userId: 'user-9', startDate: '2027-01-18', fromStep: 0 })
    expect(row).toEqual({
      patient_id: 'user-1',
      created_by: 'user-9',
      compound_id: 'mod-grf-1-29',
      name: 'CJC-1295 + Ipamorelina',
      route: 'sc',
      unit: 'mcg',
      start_date: '2027-01-18',
      time_of_day: '01:00',
      times: ['25:00'],
      steps: CJC_STEPS,
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
      template_id: 'tpl-1',
      notes: 'En ayunas',
      status: 'active',
    })
  })

  it('begins at the chosen step and never carries an id or timestamps over', () => {
    const row = buildNextCycle({ previous, userId: 'u', startDate: '2027-01-18', fromStep: 2 })
    expect(row.steps).toEqual([CJC_STEPS[2], CJC_STEPS[3]])
    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('created_at')
    expect(row).not.toHaveProperty('updated_at')
  })

  it('reads the times of a row written before several times were supported', () => {
    const legacy = reta({ times: [], time_of_day: '21:30:00' })
    const row = buildNextCycle({
      previous: legacy,
      userId: 'u',
      startDate: '2027-01-18',
      fromStep: 0,
    })
    expect(row.times).toEqual(['21:30'])
    expect(row.time_of_day).toBe('21:30')
  })

  it('previews as the schedule engine will see it, from the new start date', () => {
    const like = nextCycleLike(previous, '2027-01-18', 2)
    const info = cycleInfo(like, d('2027-01-18T10:00'))!
    expect(info.startsOn).toEqual(d('2027-01-18T00:00'))
    expect(info.totalWeeks).toBe(14)
    expect(info.doseWeeks).toBe(10)
    expect(info.steps[0]!.doseMg).toBe(0.2)
    expect(like.times).toEqual(toProtocolLike(previous).times)
  })
})

describe('closesOnNewCycle', () => {
  it('closes what is in progress and leaves history as it is', () => {
    expect(closesOnNewCycle('active')).toBe(true)
    expect(closesOnNewCycle('paused')).toBe(true)
    expect(closesOnNewCycle('completed')).toBe(false)
    expect(closesOnNewCycle('archived')).toBe(false)
  })
})

describe('trailingRest', () => {
  const infoOf = (row: Parameters<typeof toProtocolLike>[0]) => cycleInfo(toProtocolLike(row), NOW)!

  it('is the rest a plan ends in', () => {
    expect(trailingRest(infoOf(cjc()))).toEqual({
      stepIndex: 3,
      weeks: 4,
      startsOn: d('2026-12-14T00:00'),
      endsOn: d('2027-01-11T00:00'),
    })
  })

  it('is nothing for a plan that does not end in a timed rest', () => {
    expect(trailingRest(infoOf(reta()))).toBeNull()
    const openRest = cjc({
      steps: [
        { doseMg: 0.1, intervalDays: 1, durationWeeks: 2 },
        { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: null },
      ] as unknown as never,
    })
    expect(trailingRest(infoOf(openRest))).toBeNull()
    const middle = protocolRow({
      id: 'm',
      steps: [
        { doseMg: 0.1, intervalDays: 1, durationWeeks: 2 },
        { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 2 },
        { doseMg: 0.1, intervalDays: 1, durationWeeks: 2 },
      ] as unknown as never,
    })
    expect(trailingRest(infoOf(middle))).toBeNull()
  })
})

describe('adjustRest', () => {
  const weeks = (steps: ScheduleStep[]) => steps.map((s) => s.durationWeeks)

  it('lengthens or shortens the rest by whole weeks, leaving the other steps alone', () => {
    expect(weeks(adjustRest(CJC_STEPS, 1))).toEqual([1, 1, 10, 5])
    expect(weeks(adjustRest(CJC_STEPS, -1))).toEqual([1, 1, 10, 3])
    expect(weeks(adjustRest(CJC_STEPS, 4))).toEqual([1, 1, 10, 8])
  })

  it('never goes below one week or above the cap', () => {
    expect(weeks(adjustRest(adjustRest(CJC_STEPS, -3), -1))).toEqual([1, 1, 10, 1])
    expect(adjustRest(CJC_STEPS, 100).at(-1)!.durationWeeks).toBe(MAX_REST_WEEKS)
  })

  it('does not touch the plan it was given', () => {
    adjustRest(CJC_STEPS, 2)
    expect(CJC_STEPS[3]!.durationWeeks).toBe(4)
  })

  it('leaves a plan that does not end in a timed rest as it is', () => {
    const noRest = CJC_STEPS.slice(0, 3)
    expect(weeks(adjustRest(noRest, 1))).toEqual([1, 1, 10])
    const openRest: ScheduleStep[] = [
      { doseMg: 0.1, intervalDays: 1, durationWeeks: 2 },
      { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: null },
    ]
    expect(weeks(adjustRest(openRest, 1))).toEqual([2, null])
  })
})

describe('stepsUpdate', () => {
  it('carries the required columns of the row along with the new steps', () => {
    const row = cjc()
    const update = stepsUpdate(row, adjustRest(CJC_STEPS, 1))
    expect(update).toMatchObject({
      id: 'cjc',
      patient_id: 'user-1',
      created_by: 'user-1',
      compound_id: 'mod-grf-1-29',
      name: 'CJC-1295 + Ipamorelina',
      start_date: '2026-09-21',
    })
    expect((update.steps as unknown as ScheduleStep[]).at(-1)!.durationWeeks).toBe(5)
    // Nothing else is rewritten.
    expect(Object.keys(update).toSorted()).toEqual(
      ['compound_id', 'created_by', 'id', 'name', 'patient_id', 'start_date', 'steps'].toSorted(),
    )
  })
})

describe('restGuide', () => {
  it('reads the rest written in the notes, either way round', () => {
    expect(restGuide('Ciclo de 12–16 semanas y descanso de 4–8.')).toEqual({
      minWeeks: 4,
      maxWeeks: 8,
    })
    expect(restGuide('Ciclo de 12–16 semanas y descanso de 4–8 semanas.')).toEqual({
      minWeeks: 4,
      maxWeeks: 8,
    })
    expect(restGuide('luego 2–4 semanas de descanso. Ciclo total 8–12 semanas.')).toEqual({
      minWeeks: 2,
      maxWeeks: 4,
    })
    expect(restGuide('rest 2-4 weeks')).toEqual({ minWeeks: 2, maxWeeks: 4 })
  })

  it('says nothing when the notes do not', () => {
    expect(restGuide(null)).toBeNull()
    expect(restGuide('Por la mañana.')).toBeNull()
  })
})
