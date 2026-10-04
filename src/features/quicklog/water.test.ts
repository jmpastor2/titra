import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clampGoal,
  DEFAULT_GOAL_ML,
  fmtVolume,
  setWaterGoal,
  splitVolume,
  useWaterGoal,
} from './water'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('water goal', () => {
  it('clamps and rounds to 50 ml', () => {
    expect(clampGoal(2500)).toBe(2500)
    expect(clampGoal(2530)).toBe(2550)
    expect(clampGoal(100)).toBe(500)
    expect(clampGoal(9000)).toBe(6000)
    expect(clampGoal(Number.NaN)).toBe(DEFAULT_GOAL_ML)
  })

  it('starts at 2.5 L and follows the device setting everywhere', () => {
    const a = renderHook(() => useWaterGoal())
    const b = renderHook(() => useWaterGoal())
    expect(a.result.current).toBe(2500)
    act(() => setWaterGoal(3000))
    expect(a.result.current).toBe(3000)
    expect(b.result.current).toBe(3000)
    expect(localStorage.getItem('titra.waterGoalMl')).toBe('3000')
  })

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('titra.waterGoalMl', 'lots')
    const { result } = renderHook(() => useWaterGoal())
    expect(result.current).toBe(2500)
  })

  it('still works for the session when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private mode')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    const { result } = renderHook(() => useWaterGoal())
    act(() => setWaterGoal(2000))
    expect(result.current).toBe(2000)
  })
})

describe('volume text', () => {
  it('shows litres from one litre up and ml below', () => {
    expect(fmtVolume(1250, 'es')).toBe('1,25 L')
    expect(fmtVolume(1250, 'en')).toBe('1.25 L')
    expect(fmtVolume(2500, 'es')).toBe('2,5 L')
    expect(fmtVolume(750, 'es')).toBe('750 ml')
    expect(fmtVolume(0, 'es')).toBe('0 ml')
  })
  it('splits the number from its unit', () => {
    expect(splitVolume(1250, 'es')).toEqual({ value: '1,25', unit: 'L' })
    expect(splitVolume(250, 'es')).toEqual({ value: '250', unit: 'ml' })
  })
})
