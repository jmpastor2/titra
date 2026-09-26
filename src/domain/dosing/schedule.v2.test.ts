import { describe, expect, it } from 'vitest'
import type { DoseEvent, ProtocolLike } from '../types'
import {
  componentsAt,
  splitNightTime,
  adherence,
  dayAgenda,
  effectiveIntervalH,
  isAnchoredStep,
  matchOccurrences,
  minTimeSpacingH,
  nextDose,
  normaliseTimes,
  plannedDoses,
  referenceRegimen,
  scheduledDoses,
  titrationStatus,
} from './schedule'

const d = (iso: string) => new Date(iso)

/** Mod GRF 1-29 + ipamorelin, Monday–Friday at 22:00, 8 weeks on then 4 weeks off. */
const CJC_IPA: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-03-02', // a Monday
  times: ['22:00'],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 8, label: 'On' },
    { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4, label: 'Off' },
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null },
  ],
}

/** BPC-157 twice daily. */
const BPC: ProtocolLike = {
  compoundId: 'bpc-157',
  startDate: '2026-03-02',
  times: ['20:00', '08:00'],
  steps: [{ doseMg: 0.25, intervalDays: 1, durationWeeks: 4 }],
}

/** MOTS-c three times a week. */
const MOTS: ProtocolLike = {
  compoundId: 'mots-c',
  startDate: '2026-03-02',
  times: ['07:00'],
  steps: [{ doseMg: 5, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
}

/** Tirzepatide weekly. */
const TIRZ: ProtocolLike = {
  compoundId: 'tirzepatide',
  startDate: '2026-03-02',
  times: ['09:00'],
  steps: [
    { doseMg: 2.5, intervalDays: 7, durationWeeks: 4 },
    { doseMg: 5, intervalDays: 7, durationWeeks: null },
  ],
}

describe('times', () => {
  it('normalises, dedupes and sorts', () => {
    expect(normaliseTimes(['20:00', '8:00', '08:00', 'bad'])).toEqual(['08:00', '20:00'])
    expect(normaliseTimes([])).toEqual(['09:00'])
  })
  it('measures the smallest spacing between administrations', () => {
    expect(minTimeSpacingH(['08:00', '20:00'])).toBe(12)
    expect(minTimeSpacingH(['06:00', '14:00', '22:00'])).toBe(8)
    expect(minTimeSpacingH(['09:00'])).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('weekday schedules and off-cycles', () => {
  it('doses Monday to Friday only', () => {
    const week = scheduledDoses(CJC_IPA, d('2026-03-02T00:00'), d('2026-03-09T00:00'))
    expect(week.map((x) => x.at.getDay())).toEqual([1, 2, 3, 4, 5])
    expect(week.every((x) => x.at.getHours() === 22)).toBe(true)
  })

  it('produces nothing during a pause step and resumes after it', () => {
    // Weeks 9–12 are off (from 2026-04-27 to 2026-05-25).
    expect(scheduledDoses(CJC_IPA, d('2026-04-27T00:00'), d('2026-05-25T00:00'))).toEqual([])
    const resumed = scheduledDoses(CJC_IPA, d('2026-05-25T00:00'), d('2026-06-01T00:00'))
    expect(resumed).toHaveLength(5)
    expect(resumed[0]!.stepIndex).toBe(2)
  })

  it('reports the pause in titration status', () => {
    const s = titrationStatus(CJC_IPA, d('2026-05-01T12:00'))!
    expect(s.isPaused).toBe(true)
    expect(s.nextDoseMg).toBeCloseTo(0.1)
  })

  it('three times a week', () => {
    const week = scheduledDoses(MOTS, d('2026-03-02T00:00'), d('2026-03-09T00:00'))
    expect(week.map((x) => x.at.getDay())).toEqual([1, 3, 5])
  })
})

describe('multiple administrations per day', () => {
  it('schedules every time on every dosing day', () => {
    const day = scheduledDoses(BPC, d('2026-03-02T00:00'), d('2026-03-03T00:00'))
    expect(day.map((x) => x.at.getHours())).toEqual([8, 20])
  })

  it('uses the mean interval for steady-state maths', () => {
    expect(effectiveIntervalH(BPC.steps[0]!, BPC.times)).toBe(12)
    expect(effectiveIntervalH(MOTS.steps[0]!, MOTS.times)).toBeCloseTo(56)
    expect(referenceRegimen(CJC_IPA, d('2026-05-01T12:00'))).toEqual({ doseMg: 0, intervalH: 24 })
  })
})

describe('anchored vs calendar', () => {
  it('only long single-time intervals are anchored', () => {
    expect(isAnchoredStep(TIRZ.steps[0]!, TIRZ.times)).toBe(true)
    expect(isAnchoredStep(BPC.steps[0]!, BPC.times)).toBe(false)
    expect(isAnchoredStep(MOTS.steps[0]!, MOTS.times)).toBe(false)
  })

  it('a late weekly shot moves the next one', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-10T21:00'), mg: 2.5 }] // a day late
    const next = plannedDoses(TIRZ, history, d('2026-03-11T00:00'), d('2026-03-31T00:00'))[0]!
    expect(next.at).toEqual(d('2026-03-17T21:00'))
  })

  it('a missed daily dose does not move the calendar', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-02T22:05'), mg: 0.1 }]
    const next = nextDose(CJC_IPA, history, d('2026-03-04T12:00'))!
    // Tuesday was missed; the next administration is Wednesday 22:00.
    expect(next.at).toEqual(d('2026-03-04T22:00'))
    expect(next.status).toBe('upcoming')
  })

  it('a calendar dose is due inside its grace window', () => {
    const next = nextDose(CJC_IPA, [], d('2026-03-02T21:30'))!
    expect(next.status).toBe('due')
  })
})

describe('matching doses to occurrences', () => {
  it('pairs each dose with at most one occurrence', () => {
    const occ = scheduledDoses(BPC, d('2026-03-02T00:00'), d('2026-03-03T00:00'))
    const doses: DoseEvent[] = [
      { at: d('2026-03-02T08:30'), mg: 0.25 },
      { at: d('2026-03-02T09:00'), mg: 0.25 }, // double-logged morning dose
    ]
    const m = matchOccurrences(occ, doses, 4)
    expect(m[0]!.takenAt).toEqual(d('2026-03-02T08:30'))
    expect(m[1]!.takenAt).toBeNull()
  })
})

describe('today agenda', () => {
  it('shows taken, due and upcoming administrations for a twice-daily regimen', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-03T08:10'), mg: 0.25 }]
    const morning = dayAgenda(BPC, history, d('2026-03-03T12:00'))
    expect(morning.map((x) => x.status)).toEqual(['taken', 'upcoming'])
    const evening = dayAgenda(BPC, history, d('2026-03-03T20:30'))
    expect(evening.map((x) => x.status)).toEqual(['taken', 'due'])
    // Without the morning dose, 12:30 is past its 4 h tolerance.
    const skipped = dayAgenda(BPC, [], d('2026-03-03T12:30'))
    expect(skipped.map((x) => x.status)).toEqual(['missed', 'upcoming'])
  })

  it('is empty on a weekend of a 5 on / 2 off regimen', () => {
    expect(dayAgenda(CJC_IPA, [], d('2026-03-07T12:00'))).toEqual([])
  })

  it('shows an overdue weekly shot until it is taken', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-02T09:00'), mg: 2.5 }]
    const items = dayAgenda(TIRZ, history, d('2026-03-11T12:00'))
    expect(items).toHaveLength(1)
    expect(items[0]!.status).toBe('overdue')
  })

  it('shows the weekly shot as due on its day and upcoming the day before', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-02T09:00'), mg: 2.5 }]
    expect(dayAgenda(TIRZ, history, d('2026-03-09T07:00')).map((x) => x.status)).toEqual(['due'])
    expect(dayAgenda(TIRZ, history, d('2026-03-08T07:00'))).toEqual([])
  })

  it('does not call a morning shot due in the middle of the night', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-02T09:00'), mg: 2.5 }]
    expect(dayAgenda(TIRZ, history, d('2026-03-09T02:00')).map((x) => x.status)).toEqual([
      'upcoming',
    ])
    expect(nextDose(TIRZ, history, d('2026-03-09T02:00'))!.status).toBe('upcoming')
    expect(nextDose(CJC_IPA, [], d('2026-03-02T12:00'))!.status).toBe('upcoming')
  })
})

describe('occurrence-based adherence', () => {
  it('counts a weekly shot taken a day late as taken', () => {
    const history: DoseEvent[] = [
      { at: d('2026-03-02T09:00'), mg: 2.5 },
      { at: d('2026-03-10T09:00'), mg: 2.5 }, // one day late
      { at: d('2026-03-17T09:00'), mg: 2.5 },
    ]
    const a = adherence(TIRZ, history, d('2026-03-20T12:00'))
    expect(a.expected).toBe(3)
    expect(a.taken).toBe(3)
  })

  it('does not penalise a dose that is due right now', () => {
    const history: DoseEvent[] = [{ at: d('2026-03-02T22:00'), mg: 0.1 }]
    const a = adherence(CJC_IPA, history, d('2026-03-03T21:00'))
    expect(a.expected).toBe(1)
    expect(a.ratio).toBe(1)
  })

  it('penalises missed weekday doses and ignores weekends', () => {
    const history: DoseEvent[] = [
      { at: d('2026-03-02T22:00'), mg: 0.1 },
      { at: d('2026-03-03T22:00'), mg: 0.1 },
      { at: d('2026-03-05T22:00'), mg: 0.1 },
    ]
    const a = adherence(CJC_IPA, history, d('2026-03-09T12:00'))
    expect(a.expected).toBe(5)
    expect(a.taken).toBe(3)
  })
})

describe('stack components follow the titration', () => {
  it('scales the partner dose with the primary step', () => {
    const blend = {
      compoundId: 'mod-grf-1-29',
      startDate: '2026-09-21',
      times: ['22:00'],
      steps: [
        { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
        { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null },
      ],
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    }
    expect(componentsAt(blend, 0.1)[0]!.doseMg).toBeCloseTo(0.1, 9)
    expect(componentsAt(blend, 0.15)[0]!.doseMg).toBeCloseTo(0.15, 9)
  })
})

describe('night times after midnight', () => {
  const NIGHT = {
    compoundId: 'mod-grf-1-29',
    startDate: '2026-09-21',
    times: ['25:00'],
    steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  }

  it('puts Friday night 01:00 on Saturday at 01:00 but owned by Friday', () => {
    // Friday 00:00 → Sunday: Thursday night's 01:00 and Friday night's 01:00.
    const occ = scheduledDoses(NIGHT, d('2026-09-25T00:00'), d('2026-09-27T00:00'))
    expect(occ.map((o) => o.at)).toEqual([d('2026-09-25T01:00'), d('2026-09-26T01:00')])
    expect(occ.map((o) => o.day)).toEqual([d('2026-09-24T00:00'), d('2026-09-25T00:00')])
    expect(splitNightTime('25:00')).toEqual({ clock: '01:00', nextDay: true })
  })

  it("shows it on Friday's agenda and not on Saturday's", () => {
    const taken: DoseEvent[] = [{ at: d('2026-09-26T00:40'), mg: 0.1 }]
    expect(dayAgenda(NIGHT, [], d('2026-09-25T20:00')).map((x) => x.at)).toEqual([
      d('2026-09-26T01:00'),
    ])
    expect(dayAgenda(NIGHT, taken, d('2026-09-25T23:00'))[0]!.status).toBe('taken')
    expect(dayAgenda(NIGHT, taken, d('2026-09-26T10:00'))).toEqual([])
  })
})
