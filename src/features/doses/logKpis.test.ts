import { describe, expect, it } from 'vitest'
import { dayMark, logKpis, nextDose, overallAdherence, tickOf, weekFigures } from './logKpis'
import { blendDose, cjcProtocol, retaProtocol } from './testData'
import { weekPlanVsActual } from './week'

// Mon–Fri nights (01:00 of the next morning): Tue–Fri taken, Monday 28's forgotten, and an
// extra shot on Sunday morning, seen on Sunday noon.
const NIGHTS = ['2026-09-30T01:02', '2026-10-01T00:58', '2026-10-02T01:05', '2026-10-03T01:00']
const sunday = new Date('2026-10-04T12:00')

function doses() {
  return [
    ...NIGHTS.flatMap((at) => blendDose(at, { protocol_id: 'cjc' })),
    ...blendDose('2026-10-04T08:00'),
  ]
}

describe('logKpis', () => {
  it('counts the week: planned against taken, what was missed and the extra shot', () => {
    const rows = doses()
    const k = logKpis([cjcProtocol], rows, sunday)
    expect(k.week).toEqual({ planned: 5, taken: 4, missed: 1, remaining: 0, extras: 1 })
  })

  it('marks each day of the strip, Monday to Sunday', () => {
    const rows = doses()
    const k = logKpis([cjcProtocol], rows, sunday)
    expect(k.strip.map((d) => d.mark)).toEqual([
      'missed',
      'done',
      'done',
      'done',
      'done',
      'rest',
      'rest',
    ])
    expect(k.strip.map((d) => d.extra)).toEqual([false, false, false, false, false, false, true])
    expect(k.strip.map(tickOf)).toEqual(['missed', 'full', 'full', 'full', 'full', 'rest', 'rest'])
  })

  it('reads a dose taken off its time as late, and a half-taken day as partial', () => {
    const late = blendDose('2026-09-30T03:40')
    const days = weekPlanVsActual([cjcProtocol], late, new Date('2026-09-28T00:00'), sunday)
    expect(dayMark(days[1]!.cells)).toBe('late')
    expect(dayMark(days[5]!.cells)).toBe('rest')
    // Two administrations on one day: one taken, one to come.
    const one = days[1]!.cells[0]!
    expect(
      dayMark([
        one,
        { ...one, status: 'upcoming', takenAt: null, deltaMin: null, doseKey: undefined },
      ]),
    ).toBe('partial')
  })

  it('says what is next: Monday night on Sunday noon, with the day it belongs to', () => {
    const rows = doses()
    const next = nextDose([cjcProtocol], rows, sunday)
    expect(next?.protocol.id).toBe('cjc')
    expect(next?.at).toEqual(new Date('2026-10-06T01:00'))
    expect(next?.slotDay).toEqual(new Date('2026-10-05T00:00'))
    expect(next?.due).toBe(false)
  })

  it('flags a dose whose time has come as due', () => {
    const next = nextDose([retaProtocol], [], new Date('2026-10-05T10:00'))
    expect(next?.at).toEqual(new Date('2026-10-05T09:00'))
    expect(next?.due).toBe(true)
  })

  it('has nothing next when nothing is planned', () => {
    expect(nextDose([], [], sunday)).toBeNull()
  })

  it('ignores protocols that are not being followed', () => {
    const rows = doses()
    const paused = { ...cjcProtocol, status: 'paused' as const }
    const k = logKpis([paused], rows, sunday)
    expect(k.week.planned).toBe(0)
    expect(k.adherence).toBeNull()
    expect(k.next).toBeNull()
    expect(k.strip.every((d) => tickOf(d) === 'rest')).toBe(true)
  })
})

describe('tickOf', () => {
  it('draws a day as full, half-tone, missed, still to come or with nothing planned', () => {
    expect(tickOf({ mark: 'done', planned: 2, taken: 2 })).toBe('full')
    expect(tickOf({ mark: 'late', planned: 1, taken: 1 })).toBe('full')
    expect(tickOf({ mark: 'partial', planned: 2, taken: 1 })).toBe('partial')
    expect(tickOf({ mark: 'missed', planned: 2, taken: 1 })).toBe('missed')
    expect(tickOf({ mark: 'due', planned: 1, taken: 0 })).toBe('none')
    expect(tickOf({ mark: 'upcoming', planned: 1, taken: 0 })).toBe('none')
    expect(tickOf({ mark: 'rest', planned: 0, taken: 0 })).toBe('rest')
  })
})

describe('weekFigures', () => {
  it('does not count an extra among the planned or the taken', () => {
    const rows = doses()
    const days = weekPlanVsActual([cjcProtocol], rows, new Date('2026-09-28T00:00'), sunday)
    const f = weekFigures(days)
    expect(f.planned).toBe(5)
    expect(f.taken).toBe(4)
    expect(f.extras).toBe(1)
  })

  it('counts the doses still to come as remaining', () => {
    const days = weekPlanVsActual([cjcProtocol], [], new Date('2026-10-05T00:00'), sunday)
    expect(weekFigures(days)).toEqual({ planned: 5, taken: 0, missed: 0, remaining: 5, extras: 0 })
  })
})

describe('overallAdherence', () => {
  it('is the share of planned administrations taken over the last four weeks', () => {
    const rows = doses()
    const a = overallAdherence([cjcProtocol], rows, sunday)
    expect(a).not.toBeNull()
    expect(a!.expected).toBeGreaterThan(a!.taken)
    expect(a!.ratio).toBeCloseTo(a!.taken / a!.expected, 10)
  })

  it('is null before anything was due', () => {
    expect(overallAdherence([cjcProtocol], [], new Date('2026-09-20T12:00'))).toBeNull()
    expect(overallAdherence([], [], sunday)).toBeNull()
  })
})
