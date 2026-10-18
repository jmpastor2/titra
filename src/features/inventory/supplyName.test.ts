import { describe, expect, it } from 'vitest'
import type { ProtocolRow } from '@/data/database.types'
import { supplyName } from './supplyName'

const klow = {
  name: 'KLOW',
  compound_id: 'ghk-cu',
  status: 'active',
  components: [
    { compoundId: 'bpc-157', doseMg: 0.35 },
    { compoundId: 'tb-500', doseMg: 0.35 },
    { compoundId: 'kpv', doseMg: 0.35 },
  ],
} as unknown as ProtocolRow

describe('supplyName', () => {
  it('reads a blend by the name of the protocol that is exactly that mix', () => {
    expect(supplyName(['ghk-cu', 'kpv', 'tb-500', 'bpc-157'], [klow])).toBe('KLOW')
  })

  it('lists the substances otherwise', () => {
    expect(supplyName(['mots-c'], [klow])).toBe('MOTS-c')
    expect(supplyName(['ghk-cu', 'bpc-157', 'tb-500'], [klow])).toBe('GHK-Cu + BPC-157 + TB-500')
    expect(
      supplyName(['ghk-cu', 'bpc-157', 'tb-500', 'kpv'], [{ ...klow, status: 'archived' }]),
    ).toBe('GHK-Cu + BPC-157 + TB-500 + KPV')
  })
})
