import { describe, expect, it } from 'vitest'
import type { DoseRow } from '@/data/database.types'
import type { ProtocolLike, ScheduleStep } from '@/domain/types'
import { doseDrift, driftKey } from './drift'

const W15 = [1, 2, 3, 4, 5]
const STEPS: ScheduleStep[] = [
  { doseMg: 0.1, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.15, intervalDays: 1, weekdays: W15, durationWeeks: 1 },
  { doseMg: 0.2, intervalDays: 1, weekdays: W15, durationWeeks: 10 },
  { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
]
// CJC-1295 + ipamorelin Monday to Friday nights, taken after midnight: "25:00" is 01:00 of the
// next morning. Week 2 (Sep 28 – Oct 4) plans 150 mcg, from Monday Oct 5 the plan says 200 mcg.
const CJC: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-21',
  times: ['25:00'],
  steps: STEPS,
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}

const row = (compound: string, iso: string, mg: number): DoseRow => ({
  id: `${compound}-${iso}`,
  patient_id: 'u',
  protocol_id: 'cjc',
  compound_id: compound,
  dose_mg: mg,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  planned_at: null,
  notes: null,
  created_at: '',
})
const cjc = (iso: string, mg: number) => row('mod-grf-1-29', iso, mg)

// One dose per night of week 2, in the small hours after the evening they belong to.
const NIGHTS = [
  '2026-09-29T01:05', // Mon
  '2026-09-30T00:40', // Tue
  '2026-10-01T01:10', // Wed
  '2026-10-02T00:55', // Thu
  '2026-10-03T01:20', // Fri
]
const nights = (...mg: number[]) => mg.map((m, i) => cjc(NIGHTS[i]!, m))
const SUNDAY = new Date('2026-10-04T20:30')

describe('doseDrift', () => {
  it("finds the user's real case: 150 mcg planned, three nights at 200 mcg", () => {
    const drift = doseDrift(CJC, nights(0.15, 0.15, 0.2, 0.2, 0.2), SUNDAY)
    expect(drift).toEqual({
      plannedMg: 0.15,
      actualMg: 0.2,
      doses: 3,
      sinceDay: new Date('2026-09-30T00:00'), // Wednesday: the night is Wednesday's, not Thursday's
      stepIndex: 1,
      matchesNextStep: true,
    })
  })

  it('stays quiet when the doses follow the plan', () => {
    expect(doseDrift(CJC, nights(0.15, 0.15, 0.15, 0.15, 0.15), SUNDAY)).toBeNull()
  })

  it('needs two doses in a row: one off-plan dose is a one-off', () => {
    expect(doseDrift(CJC, nights(0.15, 0.15, 0.15, 0.15, 0.2), SUNDAY)).toBeNull()
  })

  it('needs the latest doses to agree with each other', () => {
    expect(doseDrift(CJC, nights(0.15, 0.15, 0.15, 0.2, 0.25), SUNDAY)).toBeNull()
    // Within 3 %: 0.2 and 0.205 are the same dose; the plan is told their mean.
    const close = doseDrift(CJC, nights(0.15, 0.15, 0.2, 0.2, 0.205), SUNDAY)
    expect(close).toMatchObject({ doses: 3, actualMg: 0.201667 })
  })

  it('counts back only while doses keep the new level', () => {
    const drift = doseDrift(CJC, nights(0.1, 0.1, 0.2, 0.2, 0.2), SUNDAY)
    expect(drift).toMatchObject({ doses: 3, actualMg: 0.2 })
    // Back on plan after the high doses: nothing to flag.
    expect(doseDrift(CJC, nights(0.15, 0.2, 0.2, 0.2, 0.15), SUNDAY)).toBeNull()
  })

  it('treats 5 % as the line between the plan and a different dose', () => {
    expect(doseDrift(CJC, nights(0.15, 0.15, 0.15, 0.157, 0.157), SUNDAY)).toBeNull() // 4.7 %
    expect(doseDrift(CJC, nights(0.15, 0.15, 0.15, 0.158, 0.158), SUNDAY)).toMatchObject({
      doses: 2,
      actualMg: 0.158,
      matchesNextStep: false,
    })
  })

  it('says when the dose taken is not the next step either', () => {
    expect(doseDrift(CJC, nights(0.15, 0.15, 0.18, 0.18, 0.18), SUNDAY)).toMatchObject({
      actualMg: 0.18,
      matchesNextStep: false,
    })
  })

  it('looks only at the primary compound and at doses that cover a planned night', () => {
    // The partner rides along at 200 mcg while the primary follows the plan.
    const partner = NIGHTS.map((iso) => row('ipamorelin', iso, 0.2))
    expect(doseDrift(CJC, [...nights(0.15, 0.15, 0.15, 0.15, 0.15), ...partner], SUNDAY)).toBeNull()
    // An extra shot on a rest day covers no night: it neither makes nor breaks a drift.
    const extra = cjc('2026-10-03T14:00', 0.5)
    expect(doseDrift(CJC, [...nights(0.15, 0.15, 0.2, 0.2, 0.2), extra], SUNDAY)).toMatchObject({
      doses: 3,
      actualMg: 0.2,
    })
  })

  it('forgets earlier steps: once the plan moves on, the old deviation is history', () => {
    // Monday Oct 5: the plan now says 200 mcg, which is what the doses were.
    expect(
      doseDrift(CJC, nights(0.15, 0.15, 0.2, 0.2, 0.2), new Date('2026-10-05T12:00')),
    ).toBeNull()
  })

  it('can look at the step a change just left, to see if the doses were already at the new dose', () => {
    const doses = nights(0.15, 0.15, 0.2, 0.2, 0.2)
    const monday = new Date('2026-10-05T08:00')
    // Today the plan says 200 mcg: nothing differs. Last week's step is the one that did.
    expect(doseDrift(CJC, doses, monday)).toBeNull()
    expect(doseDrift(CJC, doses, monday, 1)).toMatchObject({
      stepIndex: 1,
      plannedMg: 0.15,
      actualMg: 0.2,
      doses: 3,
      matchesNextStep: true,
    })
    expect(doseDrift(CJC, doses, monday, 99)).toBeNull()
  })

  it('looks back two weeks and no further', () => {
    const old = [cjc('2026-10-13T01:00', 0.25), cjc('2026-10-14T01:00', 0.25)] // Mon, Tue nights
    expect(doseDrift(CJC, old, new Date('2026-10-20T12:00'))).toMatchObject({ doses: 2 })
    expect(doseDrift(CJC, old, new Date('2026-11-02T12:00'))).toBeNull()
  })

  it('has nothing to say before the start, during a rest or after the end', () => {
    const doses = nights(0.15, 0.15, 0.2, 0.2, 0.2)
    expect(doseDrift(CJC, doses, new Date('2026-09-14T12:00'))).toBeNull()
    expect(doseDrift(CJC, doses, new Date('2026-12-20T12:00'))).toBeNull()
    expect(doseDrift(CJC, doses, new Date('2027-02-01T12:00'))).toBeNull()
    expect(doseDrift(CJC, [], SUNDAY)).toBeNull()
  })
})

describe('driftKey', () => {
  it('is stable for the protocol and the day the drift began', () => {
    expect(driftKey('cjc', new Date('2026-09-30T00:00'))).toBe('drift:cjc:2026-09-30')
  })
})
