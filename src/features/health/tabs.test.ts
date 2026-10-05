import { describe, expect, it } from 'vitest'
import { tabOf } from './tabs'

describe('tabOf', () => {
  it('opens the tab a link names', () => {
    expect(tabOf('body')).toBe('body')
    expect(tabOf('symptoms')).toBe('symptoms')
    expect(tabOf('labs')).toBe('labs')
  })

  it('falls back to the first tab for a missing or unknown one', () => {
    expect(tabOf(null)).toBe('wellbeing')
    expect(tabOf('')).toBe('wellbeing')
    expect(tabOf('weight')).toBe('wellbeing')
  })
})
