import { describe, expect, it } from 'vitest'
import { buildPkModel, mergeCurves } from './pkModel'

const at = (h: number) => new Date(2026, 9, 5, h)

describe('mergeCurves', () => {
  it('puts the curves on one row per instant, in time order', () => {
    const rows = mergeCurves(
      [
        { at: at(0), mg: 1 },
        { at: at(6), mg: 2 },
      ],
      [
        { at: at(6), mg: 2 },
        { at: at(12), mg: 1.5 },
      ],
    )
    expect(rows.map((r) => [r.t, r.hist, r.proj])).toEqual([
      [at(0).getTime(), 1, undefined],
      [at(6).getTime(), 2, 2],
      [at(12).getTime(), undefined, 1.5],
    ])
  })
  it('starts the projection and a scenario from the last history point when they do not share it', () => {
    const rows = mergeCurves(
      [{ at: at(0), mg: 1 }],
      [{ at: at(3), mg: 0.9 }],
      [{ at: at(3), mg: 0.5 }],
    )
    expect(rows[0]).toMatchObject({ hist: 1, proj: 1, alt: 1 })
    expect(rows[1]).toMatchObject({ proj: 0.9, alt: 0.5 })
  })
  it('copes with nothing at all', () => {
    expect(mergeCurves([], [])).toEqual([])
  })
})

describe('buildPkModel', () => {
  const history = [
    { at: at(0), mg: 0 },
    { at: at(6), mg: 0.1 }, // 100 mcg
  ]
  it('reads in the unit the person doses in, whatever the size', () => {
    const mcg = buildPkModel({ history, projection: [], unit: 'mcg' })
    expect(mcg.unit).toBe('mcg')
    expect(mcg.factor).toBe(1000)
    expect(mcg.yMax).toBeGreaterThanOrEqual(100)
    expect(mcg.yTicks[0]).toBe(0)
    // Retatrutide with the same small amount stays in mg: that is how it is dosed.
    const mg = buildPkModel({ history, projection: [], unit: 'mg' })
    expect(mg.unit).toBe('mg')
    expect(mg.factor).toBe(1)
    expect(mg.yMax).toBeLessThan(1)
    expect(mg.decimals).toBe(2)
  })
  it('without a unit tiny amounts fall back to mcg', () => {
    expect(buildPkModel({ history, projection: [] }).unit).toBe('mcg')
    expect(buildPkModel({ history: [{ at: at(0), mg: 2 }], projection: [] }).unit).toBe('mg')
  })
  it('scales to the curves, the scenario and the step in force', () => {
    const base = buildPkModel({
      history,
      projection: [{ at: at(12), mg: 0.2 }],
      alt: [{ at: at(12), mg: 0.3 }],
      unit: 'mcg',
    })
    expect(base.yMax).toBeGreaterThanOrEqual(300)
    const banded = buildPkModel({
      history,
      projection: [],
      unit: 'mcg',
      bands: [
        { from: at(0), to: at(24), troughMg: 0.1, peakMg: 0.4, current: true },
        { from: at(24), to: at(48), troughMg: 0.3, peakMg: 0.9 },
      ],
    })
    // The next step's band may run off the top; it does not stretch the axis.
    expect(banded.yMax).toBeGreaterThanOrEqual(400)
    expect(banded.yMax).toBeLessThan(900)
  })
  it('has a usable axis and domain when empty', () => {
    const m = buildPkModel({ history: [], projection: [] })
    expect(m.rows).toEqual([])
    expect(m.yTicks.length).toBeGreaterThan(1)
    expect(m.domain[1]).toBeGreaterThan(m.domain[0])
  })
})
