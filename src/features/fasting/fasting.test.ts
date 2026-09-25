import { describe, expect, it } from 'vitest'
import { fastingState, needsFasting } from './fasting'

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
})
