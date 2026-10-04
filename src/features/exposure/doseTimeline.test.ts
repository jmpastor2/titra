import { describe, expect, it } from 'vitest'
import type { DoseEvent, ProtocolLike } from '@/domain/types'
import { buildTimeline, isOffTime, isTakenState, type TimelineItem } from './doseTimeline'

const at = (m: number, d: number, h = 0, min = 0) => new Date(2026, m - 1, d, h, min)
const dose = (when: Date, mg: number): DoseEvent => ({ at: when, mg })

const MOTS: ProtocolLike = {
  compoundId: 'mots-c',
  startDate: '2026-09-07',
  times: ['07:00'],
  steps: [
    { doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: 4 },
    { doseMg: 1.5, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null },
  ],
}

// CJC-1295 (primary) + ipamorelin, Mon–Fri nights taken after midnight, stepping up.
const BLEND: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-28',
  times: ['25:00'],
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 10 },
    { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
  ],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}

const WEEKLY: ProtocolLike = {
  compoundId: 'semaglutide',
  startDate: '2026-08-03',
  times: ['09:00'],
  steps: [{ doseMg: 0.25, intervalDays: 7, durationWeeks: null }],
}

const states = (items: readonly TimelineItem[]) => items.map((i) => i.state)

describe('buildTimeline · calendar regimen (MOTS-c Mon/Wed/Fri 07:00)', () => {
  // Friday 25 Sep 2026, 06:00: today's shot is still ahead.
  const now = at(9, 25, 6)
  const from = at(9, 19)
  const to = at(9, 28)

  it('judges every planned administration and the extras', () => {
    const history = [
      dose(at(9, 21, 7, 4), 1), // Mon, on time
      dose(at(9, 23, 10, 30), 1), // Wed, 3 h 30 late
      dose(at(9, 20, 12), 1), // Sun: outside the plan
    ]
    const t = buildTimeline({ protocol: MOTS, history, from, to, now })
    expect(t.items.map((i) => [i.at.getDate(), i.state])).toEqual([
      [20, 'extra'],
      [21, 'taken'],
      [23, 'late'],
      [25, 'planned'],
    ])
    const late = t.items.find((i) => i.state === 'late')!
    expect(late.deltaMin).toBe(210)
    expect(late.plannedAt).toEqual(at(9, 23, 7))
    expect(late.doseMg).toBe(1)
    expect(t.summary).toMatchObject({ expected: 2, taken: 2, onTime: 1, offTime: 1, missed: 0 })
    expect(t.summary.extras).toBe(1)
    expect(t.summary.ratio).toBe(1)
    expect(t.next?.state).toBe('planned')
    expect(t.next?.at).toEqual(at(9, 25, 7))
    expect(t.states).toEqual(['taken', 'late', 'extra', 'planned'])
  })

  it('marks a slot nobody covered as missed once its grace window is over', () => {
    const t = buildTimeline({
      protocol: MOTS,
      history: [dose(at(9, 21, 7, 2), 1)],
      from,
      to,
      now: at(9, 23, 12), // Wed noon: the 07:00 shot was due 5 h ago, tolerance is 4 h
    })
    expect(states(t.items)).toEqual(['taken', 'missed', 'planned'])
    expect(t.summary).toMatchObject({ expected: 2, taken: 1, missed: 1 })
    expect(t.summary.ratio).toBe(0.5)
    // A missed slot keeps its planned time and dose, so the chart can show what was skipped.
    const missed = t.items.find((i) => i.state === 'missed')!
    expect(missed.at).toEqual(at(9, 23, 7))
    expect(missed.doseMg).toBe(1)
    expect(missed.takenAt).toBeNull()
  })

  it('reads as due while the grace window is open', () => {
    const t = buildTimeline({ protocol: MOTS, history: [], from, to, now: at(9, 25, 7, 30) })
    expect(t.items.find((i) => i.at.getDate() === 25)?.state).toBe('due')
    expect(t.next?.state).toBe('due')
    // Due never lowers adherence: only the earlier, left-behind slots count as expected.
    expect(t.summary.expected).toBe(t.summary.missed)
  })

  it('lets an explicit planned_at make a late dose cover a missed slot', () => {
    const makeUp: DoseEvent = { at: at(9, 24, 18), mg: 1, plannedAt: at(9, 23, 7) }
    const t = buildTimeline({
      protocol: MOTS,
      history: [dose(at(9, 21, 7, 1), 1), makeUp],
      from,
      to,
      now,
    })
    const covered = t.items.find((i) => i.plannedAt?.getTime() === at(9, 23, 7).getTime())!
    expect(covered.state).toBe('late')
    expect(covered.takenAt).toEqual(makeUp.at)
    expect(t.summary.extras).toBe(0)
    expect(t.summary.missed).toBe(0)
  })

  it('shows what the plan asked for next to what was injected', () => {
    const t = buildTimeline({
      protocol: MOTS,
      history: [dose(at(9, 21, 7), 0.8)],
      from,
      to,
      now,
    })
    const first = t.items[0]!
    expect(first.doseMg).toBe(0.8)
    expect(first.plannedMg).toBe(1)
    expect(t.maxMg).toBe(1)
  })

  it('reports titration steps inside the window', () => {
    // MOTS-c steps up on Monday 5 Oct (week 5).
    const t = buildTimeline({
      protocol: MOTS,
      history: [],
      from: at(9, 28),
      to: at(10, 9),
      now: at(9, 30),
    })
    expect(t.steps.map((s) => [s.kind, s.doseMg, s.prevDoseMg])).toEqual([['up', 1.5, 1]])
    const doses = t.items.map((i) => [i.at.getDate(), i.doseMg])
    expect(doses).toEqual([
      [28, 1],
      [30, 1],
      [2, 1],
      [5, 1.5],
      [7, 1.5],
    ])
  })
})

describe('buildTimeline · blend as one series', () => {
  // Wednesday 30 Sep 2026, 08:00. The plan is on step 1 (0.1) until Mon 5 Oct.
  const now = at(9, 30, 8)
  const history = [
    dose(at(9, 29, 1, 5), 0.1), // Monday's night shot, taken Tuesday 01:05
    dose(at(9, 30, 1, 20), 0.1), // Tuesday's night shot
  ]
  const partners = [
    {
      compoundId: 'ipamorelin',
      history: [dose(at(9, 29, 1, 5), 0.1), dose(at(9, 30, 1, 20), 0.1)],
    },
  ]
  it('puts the night shot after midnight on its own evening and carries the partner dose', () => {
    const t = buildTimeline({
      protocol: BLEND,
      history,
      partners,
      from: at(9, 28),
      to: at(10, 6),
      now,
    })
    const taken = t.items.filter((i) => i.takenAt)
    expect(taken).toHaveLength(2)
    expect(taken[0]!.plannedAt).toEqual(at(9, 29, 1))
    expect(taken[0]!.partners).toEqual([{ compoundId: 'ipamorelin', mg: 0.1 }])
    expect(taken.map((i) => i.state)).toEqual(['taken', 'taken'])
    // The slot after the last shot is planned, with the partner at the proportional dose.
    const planned = t.items.filter((i) => i.state === 'planned')
    expect(planned[0]!.at).toEqual(at(10, 1, 1))
    expect(planned[0]!.partners).toEqual([{ compoundId: 'ipamorelin', mg: 0.1 }])
    // From Monday 5 Oct the plan steps up: the dose and its partner follow the titration.
    const stepped = planned.find((i) => i.at.getTime() === at(10, 6, 1).getTime())
    expect(stepped).toBeUndefined() // 6 Oct 01:00 is outside the window (to = 6 Oct 00:00)
    expect(t.steps.map((s) => [s.kind, s.doseMg])).toEqual([['up', 0.15]])
  })

  it('marks an unlogged night as missed, not the whole day', () => {
    const t = buildTimeline({
      protocol: BLEND,
      history: [history[0]!],
      from: at(9, 28),
      to: at(10, 3),
      now,
    })
    // Night slots: Mon's (taken Tue 01:05), Tue's (nothing by Wed 08:00 → missed), then ahead.
    expect(states(t.items)).toEqual(['taken', 'missed', 'planned', 'planned'])
    expect(t.items[1]!.at).toEqual(at(9, 30, 1))
    expect(t.summary).toMatchObject({ expected: 2, taken: 1, missed: 1 })
  })
})

describe('buildTimeline · regimen anchored on the last dose', () => {
  it('counts a weekly shot taken a day late as late, not as missed plus extra', () => {
    // Past administrations are judged against the calendar, as the week card does.
    const history = [
      dose(at(8, 3, 9, 5), 0.25),
      dose(at(8, 11, 10), 0.25), // Tuesday, a day and an hour after its Monday slot
      dose(at(8, 18, 9), 0.25),
    ]
    const t = buildTimeline({
      protocol: WEEKLY,
      history,
      from: at(8, 1),
      to: at(8, 31),
      now: at(8, 20, 12),
    })
    expect(states(t.items.filter((i) => i.takenAt))).toEqual(['taken', 'late', 'late'])
    expect(t.summary.extras).toBe(0)
    expect(t.summary.missed).toBe(0)
    // The rhythm continues from the last real dose: Tuesday 25 Aug 09:00.
    expect(t.next?.state).toBe('planned')
    expect(t.next?.at).toEqual(at(8, 25, 9))
  })
})

describe('buildTimeline · other rhythms', () => {
  const TWICE: ProtocolLike = {
    compoundId: 'bpc-157',
    startDate: '2026-09-21',
    times: ['08:00', '20:00'],
    steps: [{ doseMg: 0.25, intervalDays: 1, durationWeeks: null }],
  }

  it('judges each of two daily shots on its own', () => {
    const history = [
      dose(at(9, 22, 8, 10), 0.25),
      dose(at(9, 22, 20, 5), 0.25),
      dose(at(9, 23, 8, 0), 0.25),
      // Wednesday evening never taken.
    ]
    const t = buildTimeline({
      protocol: TWICE,
      history,
      from: at(9, 22),
      to: at(9, 25),
      now: at(9, 24, 12),
    })
    // Tue 08:00, 20:00 and Wed 08:00 taken; Wed 20:00 left behind; Thu 08:00 just inside its
    // four hours; Thu 20:00 ahead.
    expect(states(t.items)).toEqual(['taken', 'taken', 'taken', 'missed', 'due', 'planned'])
  })

  it('has no administrations during a rest and shows a dose taken then as an extra', () => {
    const CYCLE: ProtocolLike = {
      compoundId: 'mots-c',
      startDate: '2026-09-07',
      times: ['07:00'],
      steps: [
        { doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: 1 },
        { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 1 },
        { doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null },
      ],
    }
    const t = buildTimeline({
      protocol: CYCLE,
      history: [dose(at(9, 16, 7, 5), 1)], // Wednesday of the rest week
      from: at(9, 7),
      to: at(9, 28),
      now: at(9, 25),
    })
    // Week 1: Mon, Wed, Fri (missed); rest week: only the extra; week 3: Mon, Wed, Fri (missed/ahead).
    const rest = t.items.filter((i) => i.at >= at(9, 14) && i.at < at(9, 21))
    expect(states(rest)).toEqual(['extra'])
    expect(t.steps.map((s) => s.kind)).toEqual(['pause', 'resume'])
  })

  it('follows a regimen every three days by the calendar in the past and by the last dose ahead', () => {
    const EVERY3: ProtocolLike = {
      compoundId: 'semaglutide',
      startDate: '2026-09-01',
      times: ['09:00'],
      steps: [{ doseMg: 0.5, intervalDays: 3, durationWeeks: null }],
    }
    const t = buildTimeline({
      protocol: EVERY3,
      history: [dose(at(9, 1, 9, 5), 0.5), dose(at(9, 4, 9, 0), 0.5), dose(at(9, 8, 9, 0), 0.5)],
      from: at(9, 1),
      to: at(9, 16),
      now: at(9, 9, 12),
    })
    // The third shot came a day late: covered, not missed. The next one is three days after it.
    expect(t.summary.missed).toBe(0)
    expect(t.summary.extras).toBe(0)
    expect(t.next?.at).toEqual(at(9, 11, 9))
  })
})

describe('buildTimeline · without a plan', () => {
  it('shows free doses as plain taken doses', () => {
    const t = buildTimeline({
      protocol: null,
      history: [dose(at(9, 20, 8), 0.5), dose(at(9, 22, 20), 0.5)],
      from: at(9, 14),
      to: at(9, 28),
      now: at(9, 25),
    })
    expect(states(t.items)).toEqual(['taken', 'taken'])
    expect(t.items[0]!.plannedAt).toBeNull()
    expect(t.hasPlan).toBe(false)
    expect(t.summary).toMatchObject({ expected: 0, taken: 0, ratio: 1 })
    expect(t.next).toBeNull()
    expect(t.steps).toEqual([])
  })

  it('handles an empty history and a protocol that has not started', () => {
    const empty = buildTimeline({
      protocol: null,
      history: [],
      from: at(9, 14),
      to: at(9, 28),
      now: at(9, 25),
    })
    expect(empty.items).toEqual([])
    expect(empty.maxMg).toBe(0)
    const future = buildTimeline({
      protocol: { ...MOTS, startDate: '2026-12-01' },
      history: [],
      from: at(9, 14),
      to: at(9, 28),
      now: at(9, 25),
    })
    expect(future.items).toEqual([])
  })

  it('keeps a dose logged in the future as a taken mark to the right of now', () => {
    const t = buildTimeline({
      protocol: null,
      history: [dose(at(9, 27, 8), 1)],
      from: at(9, 14),
      to: at(9, 28),
      now: at(9, 25),
    })
    expect(t.items).toHaveLength(1)
    expect(t.items[0]!.at.getTime()).toBeGreaterThan(at(9, 25).getTime())
  })

  it('keeps two doses in the same hour apart', () => {
    const t = buildTimeline({
      protocol: null,
      history: [dose(at(9, 20, 8, 0), 0.5), dose(at(9, 20, 8, 40), 0.5)],
      from: at(9, 14),
      to: at(9, 28),
      now: at(9, 25),
    })
    expect(t.items.map((i) => i.key)).toHaveLength(2)
    expect(new Set(t.items.map((i) => i.key)).size).toBe(2)
  })
})

describe('state helpers', () => {
  it('tells off-time and taken states apart', () => {
    expect(isOffTime('late')).toBe(true)
    expect(isOffTime('early')).toBe(true)
    expect(isOffTime('taken')).toBe(false)
    expect(isTakenState('extra')).toBe(true)
    expect(isTakenState('missed')).toBe(false)
    expect(isTakenState('planned')).toBe(false)
  })
})
