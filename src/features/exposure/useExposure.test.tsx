import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { setSupabaseClient } from '@/lib/supabase'
import type { ProtocolLike } from '@/domain/types'
import { doseRow, weeklyProtocol } from './testData'
import { deriveExposure, protocolFor, useExposure } from './useExposure'

const BLEND: ProtocolLike = {
  compoundId: 'mod-grf-1-29',
  startDate: '2026-09-28',
  times: ['25:00'],
  steps: [
    { doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.15, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 1 },
    { doseMg: 0.2, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: 10 },
    { doseMg: 0, intervalDays: 1, pause: true, durationWeeks: 4 },
  ],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
}

describe('protocolFor', () => {
  it('leaves the primary compound alone', () => {
    expect(protocolFor(BLEND, 'mod-grf-1-29')).toBe(BLEND)
  })
  it('gives a blend partner the dose of the vial in proportion to the titration', () => {
    const ipa = protocolFor(BLEND, 'ipamorelin')
    expect(ipa.compoundId).toBe('ipamorelin')
    expect(ipa.components).toEqual([])
    // 1:1 vial: ipamorelin steps up with the CJC dose, and rests with it.
    expect(ipa.steps.map((s) => s.doseMg)).toEqual([0.1, 0.15, 0.2, 0])
    expect(ipa.steps[3]?.pause).toBe(true)
  })
  it('returns the protocol as is for a compound that is not part of it', () => {
    expect(protocolFor(BLEND, 'retatrutide')).toBe(BLEND)
  })
})

describe('deriveExposure with the lab account', () => {
  // Monday 5 Oct 2026, five minutes past midnight: week 4 of retatrutide and MOTS-c.
  const now = new Date(2026, 9, 5, 0, 5)
  const store = buildStore(now)
  const protocols = store.protocols as unknown as ProtocolRow[]
  const doses = store.doses as unknown as DoseRow[]
  const items = deriveExposure(protocols, doses, now)
  const byId = (id: string) => items.find((x) => x.compoundId === id)!

  it('lists a blend as its primary followed by its partner, in the order the plans began', () => {
    expect(items.map((x) => x.compoundId)).toEqual([
      'retatrutide',
      'mots-c',
      'mod-grf-1-29',
      'ipamorelin',
    ])
  })

  it('does not reorder when a dose is logged', () => {
    const logged = [
      ...doses,
      {
        ...doses.find((d) => d.compound_id === 'mots-c')!,
        id: 'new',
        administered_at: new Date(2026, 9, 5, 0, 4).toISOString(),
      },
    ]
    expect(deriveExposure(protocols, logged, now).map((x) => x.compoundId)).toEqual(
      items.map((x) => x.compoundId),
    )
  })

  it('stamps every entry with the clock it was derived at', () => {
    for (const x of items) expect(x.asOf).toBe(now)
  })

  it('shows the blend as one series under the protocol name, partners attached', () => {
    const cjc = byId('mod-grf-1-29')
    expect(cjc.title).toBe('CJC-1295 + Ipamorelina')
    expect(cjc.partnerOf).toBeNull()
    expect(cjc.partners.map((p) => p.compoundId)).toEqual(['ipamorelin'])
    // One partner dose row per administration, at the same instant as the primary's.
    expect(cjc.partners[0]!.history).toHaveLength(cjc.history.length)
    expect(cjc.partners[0]!.history[0]!.at).toEqual(cjc.history[0]!.at)
    const ipa = byId('ipamorelin')
    expect(ipa.partnerOf?.compound_id).toBe('mod-grf-1-29')
    expect(ipa.partners).toEqual([])
    expect(ipa.title).toBe('Ipamorelina')
  })

  it('titrates a partner with the blend: its next dose is the current step, not the first', () => {
    // Week 2 of the blend: 150 mcg of each.
    expect(byId('mod-grf-1-29').next?.doseMg).toBe(0.15)
    expect(byId('ipamorelin').next?.doseMg).toBeCloseTo(0.15, 10)
    expect(byId('ipamorelin').reference?.doseMg).toBeCloseTo(0.15, 10)
    expect(byId('ipamorelin').titration?.nextDoseMg).toBeCloseTo(0.2, 10)
  })

  it('has an amount on board only where the model covers the compound', () => {
    expect(byId('retatrutide').nowMg).toBeCloseTo(0.93, 1)
    expect(byId('mots-c').nowMg).toBeNull()
    expect(byId('mod-grf-1-29').nowMg).toBeNull()
  })
})

describe('deriveExposure edge states', () => {
  // Wednesday 7 Oct 2026, noon: the Monday shot is two and a half days behind.
  const now = new Date(2026, 9, 7, 12)
  const reta = (doses: DoseRow[], protocols = [weeklyProtocol()]) =>
    deriveExposure(protocols, doses, now).find((x) => x.compoundId === 'retatrutide')!

  it('knows a protocol with no doses yet: nothing on board, nothing taken, a dose planned', () => {
    const x = reta([])
    expect(x.nowMg).toBe(0)
    expect(x.lastDose).toBeNull()
    expect(x.history).toEqual([])
    expect(x.next?.doseMg).toBe(1.5)
    expect(x.progress?.fraction).toBe(0)
  })

  it('has a small, rising amount after a single dose', () => {
    const x = reta([doseRow(new Date(2026, 9, 5, 9), 1.5)])
    expect(x.nowMg).toBeGreaterThan(0.5)
    expect(x.nowMg).toBeLessThan(1.5)
    expect(x.lastDose?.mg).toBe(1.5)
  })

  it('does not call a dose dated ahead the last dose, and puts nothing on board for it', () => {
    const ahead = doseRow(new Date(2026, 9, 9, 9), 1.5)
    const taken = doseRow(new Date(2026, 9, 5, 9), 1.5)
    const withAhead = reta([taken, ahead])
    const without = reta([taken])
    expect(withAhead.lastDose?.at).toEqual(new Date(2026, 9, 5, 9))
    expect(withAhead.nowMg).toBe(without.nowMg)
    // It is still in the history, so the projection and the timeline can show it.
    expect(withAhead.history).toHaveLength(2)
  })

  it('has almost nothing on board for a dose from two years ago, and says when it was', () => {
    const x = reta([doseRow(new Date(2024, 9, 7, 9), 1.5)])
    expect(x.nowMg).toBeLessThan(1e-6)
    expect(x.lastDose?.at.getFullYear()).toBe(2024)
  })

  it('counts two doses in the same hour, each at its own time', () => {
    const one = reta([doseRow(new Date(2026, 9, 5, 9, 0), 1.5)])
    const two = reta([
      doseRow(new Date(2026, 9, 5, 9, 0), 1.5),
      doseRow(new Date(2026, 9, 5, 9, 40), 0.5),
    ])
    expect(two.nowMg).toBeGreaterThan(one.nowMg!)
    expect(two.history).toHaveLength(2)
    expect(two.lastDose?.at).toEqual(new Date(2026, 9, 5, 9, 40))
  })

  it('falls back to the compound name when a blend protocol has no name', () => {
    const blend = weeklyProtocol({
      id: 'b',
      compound_id: 'mod-grf-1-29',
      name: '  ',
      components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
    })
    const items = deriveExposure([blend], [], now)
    expect(items.find((x) => x.compoundId === 'mod-grf-1-29')?.title).toBe('CJC-1295 (sin DAC)')
  })

  it('keeps a compound that was dosed but has no active protocol, after the planned ones', () => {
    const items = deriveExposure(
      [weeklyProtocol()],
      [
        doseRow(new Date(2026, 9, 5, 9), 1.5),
        doseRow(new Date(2026, 9, 3, 9), 0.2, { compound_id: 'ipamorelin', protocol_id: null }),
      ],
      now,
    )
    expect(items.map((x) => x.compoundId)).toEqual(['retatrutide', 'ipamorelin'])
    expect(items[1]!.protocol).toBeNull()
    expect(items[1]!.next).toBeNull()
  })
})

describe('useExposure clock', () => {
  afterEach(() => setSupabaseClient(null))

  function setup(startNow: Date) {
    const store = buildStore(startNow, { empty: true })
    store.protocols.push({
      id: 'p1',
      patient_id: LAB_USER.id,
      compound_id: 'retatrutide',
      name: 'Retatrutida',
      route: 'sc',
      unit: 'mg',
      start_date: '2026-01-05',
      time_of_day: '09:00',
      times: ['09:00'],
      steps: [{ doseMg: 1.5, intervalDays: 1, weekdays: [1], durationWeeks: null }],
      components: [],
      status: 'active',
      template_id: null,
      notes: null,
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z',
    })
    setSupabaseClient(createFakeSupabase(store, LAB_USER))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    return { store, client, wrapper }
  }

  it('never leaves a dose logged moments ago in the future of the readout', async () => {
    const wall = Date.now()
    // The page's clock is two minutes old, as on a screen that has been open for a while.
    const pageNow = new Date(wall - 120_000)
    const { store, client, wrapper } = setup(pageNow)
    const { result } = renderHook(() => useExposure(LAB_USER.id, pageNow), { wrapper })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    const before = result.current.items.find((x) => x.compoundId === 'retatrutide')!
    expect(before.history).toHaveLength(0)

    // The user logs a dose "now": 30 seconds ago, after the page's clock.
    const takenAt = new Date(wall - 30_000)
    store.doses.push({
      id: 'd1',
      patient_id: LAB_USER.id,
      protocol_id: 'p1',
      compound_id: 'retatrutide',
      dose_mg: 1.5,
      administered_at: takenAt.toISOString(),
      site_id: null,
      inventory_id: null,
      batch_id: null,
      planned_at: null,
      notes: null,
      created_at: takenAt.toISOString(),
    })
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['doses', LAB_USER.id] })
    })
    await waitFor(() => expect(result.current.doses).toHaveLength(1))

    const after = result.current.items.find((x) => x.compoundId === 'retatrutide')!
    expect(after.lastDose?.at).toEqual(takenAt)
    // The clock moved up to the moment the data landed, so the dose already counts.
    expect(result.current.now.getTime()).toBeGreaterThanOrEqual(takenAt.getTime())
    expect(after.asOf.getTime()).toBeGreaterThanOrEqual(takenAt.getTime())
    expect(after.nowMg).toBeGreaterThan(0)
  })

  it('keeps a clock that is ahead of the data as it is', async () => {
    const future = new Date(Date.now() + 3_600_000)
    const { wrapper } = setup(future)
    const { result } = renderHook(() => useExposure(LAB_USER.id, future), { wrapper })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.now).toEqual(future)
  })
})
