import { describe, expect, it } from 'vitest'
import { blendShares } from './blendMath'

describe('blendShares', () => {
  it('CJC/Ipa 5 + 5 mg in 3 mL: 6 U is 100 mcg of each', () => {
    const shares = blendShares(
      [
        { compoundId: 'mod-grf-1-29', mg: 5 },
        { compoundId: 'ipamorelin', mg: 5 },
      ],
      3,
      6,
    )
    expect(shares.map((s) => s.compoundId)).toEqual(['mod-grf-1-29', 'ipamorelin'])
    for (const s of shares) {
      expect(s.mg).toBeCloseTo(0.1, 6)
      expect(s.mgPerMl).toBeCloseTo(5 / 3, 6)
    }
  })

  it('KLOW 80 mg in 3 mL: 10 U is 1.67 mg GHK-Cu and 333 mcg of the rest', () => {
    const [ghk, bpc, tb, kpv] = blendShares(
      [
        { compoundId: 'ghk-cu', mg: 50 },
        { compoundId: 'bpc-157', mg: 10 },
        { compoundId: 'tb-500', mg: 10 },
        { compoundId: 'kpv', mg: 10 },
      ],
      3,
      10,
    )
    expect(ghk!.mg).toBeCloseTo(1.6667, 3)
    for (const s of [bpc!, tb!, kpv!]) expect(s.mg).toBeCloseTo(0.3333, 3)
  })

  it('returns zeros for an empty or invalid diluent', () => {
    const shares = blendShares([{ compoundId: 'x', mg: 5 }], 0, 10)
    expect(shares[0]).toMatchObject({ mg: 0, mgPerMl: 0 })
  })
})
