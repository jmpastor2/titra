import { describe, expect, it } from 'vitest'
import { clock, fastingState, fastProgress, minutesAgo, mostRecent, needsFasting } from './fasting'

describe('fasting', () => {
  it('applies to GH secretagogues only', () => {
    expect(needsFasting(['mod-grf-1-29', 'ipamorelin'])).toBe(true)
    expect(needsFasting(['retatrutide'])).toBe(false)
  })

  it('counts two hours from the last meal', () => {
    const dinner = new Date('2026-09-25T23:00')
    const early = fastingState(dinner, new Date('2026-09-26T00:02'))
    expect(early.ready).toBe(false)
    expect(early.waitMin).toBe(58)
    expect(early.readyAt).toEqual(new Date('2026-09-26T01:00'))
    expect(fastingState(dinner, new Date('2026-09-26T01:00')).ready).toBe(true)
    expect(fastingState(null, new Date()).ready).toBe(true)
  })

  it('never asks for more than the two hours, even if a clock lags by a few seconds', () => {
    const meal = new Date('2026-09-25T23:00:20')
    expect(fastingState(meal, new Date('2026-09-25T23:00:00')).waitMin).toBe(120)
  })
})

describe('fasting helpers', () => {
  it('measures progress through the 2 h fast', () => {
    const meal = new Date('2026-09-25T23:00')
    expect(fastProgress(meal, new Date('2026-09-25T23:00'))).toBe(0)
    expect(fastProgress(meal, new Date('2026-09-26T00:00'))).toBe(0.5)
    expect(fastProgress(meal, new Date('2026-09-26T03:00'))).toBe(1)
    expect(fastProgress(null, new Date())).toBe(0)
  })

  it('reads a typed time as the most recent one', () => {
    const now = new Date('2026-09-26T00:30')
    expect(mostRecent('23:15', now)).toEqual(new Date('2026-09-25T23:15'))
    expect(mostRecent('00:10', now)).toEqual(new Date('2026-09-26T00:10'))
    expect(mostRecent('', now)).toEqual(now)
    expect(mostRecent('junk', now)).toEqual(now)
  })

  it('goes back by minutes and prints the clock', () => {
    const now = new Date('2026-09-26T00:30')
    expect(minutesAgo(45, now)).toEqual(new Date('2026-09-25T23:45'))
    expect(clock(new Date('2026-09-26T07:05'))).toBe('07:05')
  })
})
