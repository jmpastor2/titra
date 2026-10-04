import { describe, expect, it } from 'vitest'
import type { InventoryRow } from '@/data/database.types'
import {
  alertKey,
  effectiveExpiry,
  inUseProgress,
  splitDismissed,
  stockAlerts,
  vialOutlook,
  type StockAlert,
} from './alerts'
import { restockPlan, vialRunway } from './vials'

const vial = (over: Partial<InventoryRow>): InventoryRow =>
  ({
    id: 'v',
    patient_id: 'u',
    compound_id: 'mots-c',
    form: 'vial',
    label: 'MOTS-c 10 mg',
    total_mg: 10,
    remaining_mg: 2.5,
    concentration_mg_per_ml: 10,
    diluent_ml: 1,
    components: [],
    opened_at: '2026-09-07',
    expires_at: null,
    lot: null,
    storage_notes: null,
    archived: false,
    created_at: '',
    updated_at: '',
    ...over,
  }) as InventoryRow

/** A vial still in powder form. */
const powder = (over: Partial<InventoryRow> = {}) =>
  vial({
    id: 'r',
    label: 'MOTS-c reserva',
    remaining_mg: 10,
    concentration_mg_per_ml: null,
    diluent_ml: null,
    opened_at: null,
    ...over,
  })

const at = (d: string) => new Date(`${d}T09:00`)
const day = (d: string) => new Date(`${d}T00:00`)

describe('effective expiry', () => {
  it('estimates expiry 28 days after reconstitution', () => {
    expect(effectiveExpiry(vial({}))).toEqual({ date: day('2026-10-05'), estimated: true })
    expect(
      effectiveExpiry(vial({ concentration_mg_per_ml: null, diluent_ml: null, opened_at: null })),
    ).toBeNull()
  })

  it('takes the earlier of the label date and the in-use period', () => {
    // Opened 7 Sep: the in-use period ends 5 Oct, before a label date of December.
    expect(effectiveExpiry(vial({ expires_at: '2026-12-01' }))).toEqual({
      date: day('2026-10-05'),
      estimated: true,
    })
    // A label date before it wins and is not an estimate.
    expect(effectiveExpiry(vial({ expires_at: '2026-09-20' }))).toEqual({
      date: day('2026-09-20'),
      estimated: false,
    })
  })

  it('counts only the label date while the vial is still powder', () => {
    expect(effectiveExpiry(powder({ expires_at: '2027-02-01' }))).toEqual({
      date: day('2027-02-01'),
      estimated: false,
    })
    expect(effectiveExpiry(powder())).toBeNull()
  })
})

describe('in-use progress', () => {
  it('reads day 14 of 28 on the fourteenth day', () => {
    const p = inUseProgress(vial({}), at('2026-09-20'))!
    expect(p.day).toBe(14)
    expect(p.of).toBe(28)
    expect(p.fraction).toBeCloseTo(0.5, 6)
    expect(p.over).toBe(false)
    expect(p.estimated).toBe(true)
    expect(p.endsAt).toEqual(day('2026-10-05'))
  })

  it('starts at day 1 and stays at the last day once the date has gone by', () => {
    expect(inUseProgress(vial({}), at('2026-09-07'))!.day).toBe(1)
    const late = inUseProgress(vial({}), at('2026-10-09'))!
    expect(late).toMatchObject({ day: 28, fraction: 1, over: true })
    // The discard date itself is still the last day, not over.
    expect(inUseProgress(vial({}), at('2026-10-05'))!.over).toBe(false)
  })

  it('counts towards an earlier label date instead', () => {
    const p = inUseProgress(vial({ expires_at: '2026-09-27' }), at('2026-09-20'))!
    expect(p.of).toBe(20)
    expect(p.estimated).toBe(false)
  })

  it('is absent for powder', () => {
    expect(inUseProgress(powder({ expires_at: '2027-02-01' }), at('2026-09-20'))).toBeNull()
  })
})

describe('vial outlook', () => {
  it('says the expiry forces the next vial when it comes before the run-out', () => {
    // 10 mg left covers all three doses: the expiry (5 Oct), not the stock, forces the next vial.
    const runway = vialRunway(10, [
      { at: at('2026-10-01'), doseMg: 1 },
      { at: at('2026-10-30'), doseMg: 1 },
      { at: at('2026-11-02'), doseMg: 1 },
    ])
    const o = vialOutlook(vial({ remaining_mg: 10 }), runway, at('2026-09-30'))
    expect(o.expiresFirst).toBe(true)
    expect(o.needBy).toEqual(day('2026-10-05'))
    expect(o.expiryDays).toBe(5)
    // Plenty of product left: it is expiring, not running low.
    expect(o.runningLow).toBe(false)
    expect(o.short).toBe(true)
  })

  it('is running low when two doses or fewer are left', () => {
    const runway = vialRunway(2.5, [
      { at: at('2026-10-01'), doseMg: 1 },
      { at: at('2026-10-30'), doseMg: 1 },
      { at: at('2026-11-02'), doseMg: 1 },
    ])
    const o = vialOutlook(vial({ remaining_mg: 2.5 }), runway, at('2026-09-30'))
    expect(o.runningLow).toBe(true)
    expect(o.short).toBe(true)
  })

  it('is neither with a long supply and a distant expiry', () => {
    // Opened two days ago: the in-use period ends on 27 Oct, a label date in 2027 is later.
    const fresh = vial({ remaining_mg: 10, opened_at: '2026-09-28', expires_at: '2027-06-01' })
    const runway = vialRunway(10, [{ at: at('2026-10-01'), doseMg: 1 }])
    const o = vialOutlook(fresh, runway, at('2026-09-30'))
    expect(o.runningLow).toBe(false)
    expect(o.short).toBe(false)
    expect(o.expiryDays).toBe(26)
  })
})

describe('stock alerts', () => {
  it('asks to reconstitute the reserve and warns about expiry and reorder', () => {
    const open = vial({})
    const reserve = powder()
    const doses = [
      '2026-09-30',
      '2026-10-02',
      '2026-10-05',
      '2026-10-07',
      '2026-10-09',
      '2026-10-12',
      '2026-10-14',
      '2026-10-16',
      '2026-10-19',
      '2026-10-21',
    ].map((d) => ({ at: at(d), doseMg: 1.5 }))
    const runways = new Map([['v', vialRunway(2.5, doses)]])
    const restock = restockPlan([open, reserve], new Map([['mots-c', doses]]))
    const alerts = stockAlerts([open, reserve], restock, runways, new Date('2026-09-30T08:00'))
    const kinds = alerts.map((a) => a.kind)
    expect(kinds).toContain('reconstitute')
    expect(kinds).toContain('expiresSoon') // estimated 5 Oct
    expect(kinds).toContain('reorder') // 12.5 mg covers 8 doses: short on 19 Oct
    const reconstitute = alerts.find((a) => a.kind === 'reconstitute')!
    expect(reconstitute.doses).toBe(1)
    // The alert says which vial to reconstitute: the reserve, not the one running out.
    expect(reconstitute.reserveVialId).toBe('r')
  })

  it('flags an expired vial first', () => {
    const alerts = stockAlerts(
      [vial({ expires_at: '2026-09-20' })],
      [],
      new Map(),
      new Date('2026-09-30T08:00'),
    )
    expect(alerts[0]!.kind).toBe('expired')
    expect(alerts[0]!.severity).toBe('danger')
  })

  it('stops asking for a reserve once another reconstituted vial can take over', () => {
    const doses = ['2026-10-01', '2026-10-03', '2026-10-05'].map((d) => ({
      at: at(d),
      doseMg: 1.5,
    }))
    const open = vial({ remaining_mg: 2.5, opened_at: '2026-09-25' })
    const next = vial({ id: 'n', remaining_mg: 10, opened_at: '2026-09-29' })
    const runways = new Map([['v', vialRunway(2.5, doses)]])
    const alerts = stockAlerts(
      [open, next],
      restockPlan([open, next], new Map([['mots-c', doses]])),
      runways,
      new Date('2026-09-30T08:00'),
    )
    expect(alerts.map((a) => a.kind)).not.toContain('reconstitute')
    expect(alerts.map((a) => a.kind)).not.toContain('runsOut')
  })

  it('says runs out when there is no other vial to prepare', () => {
    const doses = ['2026-10-01', '2026-10-03'].map((d) => ({ at: at(d), doseMg: 1.5 }))
    const open = vial({ remaining_mg: 2.5, opened_at: '2026-09-25' })
    const alerts = stockAlerts(
      [open],
      [],
      new Map([['v', vialRunway(2.5, doses)]]),
      new Date('2026-09-30T08:00'),
    )
    const runsOut = alerts.find((a) => a.kind === 'runsOut')!
    expect(runsOut.severity).toBe('warn')
    expect(runsOut.reserveVialId).toBeUndefined()
  })

  it('does not ask to reconstitute a pen: it comes ready to use', () => {
    const doses = ['2026-10-01', '2026-10-03'].map((d) => ({ at: at(d), doseMg: 1.5 }))
    const open = vial({ remaining_mg: 2.5, opened_at: '2026-09-25' })
    const pen = powder({ form: 'pen' })
    const alerts = stockAlerts(
      [open, pen],
      [],
      new Map([['v', vialRunway(2.5, doses)]]),
      new Date('2026-09-30T08:00'),
    )
    // The open vial runs out; the pen can take over, so nothing to reconstitute.
    expect(alerts.map((a) => a.kind)).not.toContain('reconstitute')
  })

  describe('leftover', () => {
    const doses = ['2026-10-01', '2026-10-03', '2026-10-05'].map((d) => ({ at: at(d), doseMg: 1 }))
    const old = vial({
      id: 'old',
      remaining_mg: 0.3,
      opened_at: '2026-09-20',
      label: 'MOTS-c viejo',
    })
    const fresh = vial({
      id: 'new',
      remaining_mg: 9,
      opened_at: '2026-09-29',
      label: 'MOTS-c nuevo',
    })
    const now = new Date('2026-09-30T08:00')

    it('flags a vial that cannot cover a dose while another one is in use', () => {
      // The new vial is the one drawn from: the old one cannot cover the 1 mg dose.
      const runways = new Map([['new', vialRunway(9, doses)]])
      const alerts = stockAlerts([old, fresh], [], runways, now)
      const leftover = alerts.filter((a) => a.kind === 'leftover')
      expect(leftover).toHaveLength(1)
      expect(leftover[0]).toMatchObject({
        vialId: 'old',
        severity: 'info',
        mg: 0.3,
        compoundIds: ['mots-c'],
      })
      // And it is not also reported as running out.
      expect(alerts.filter((a) => a.vialId === 'old').map((a) => a.kind)).toEqual(['leftover'])
    })

    it('does not flag a vial that still covers the next dose', () => {
      const enough = vial({ id: 'old', remaining_mg: 4, opened_at: '2026-09-20' })
      const runways = new Map([['new', vialRunway(9, doses)]])
      expect(stockAlerts([enough, fresh], [], runways, now).map((a) => a.kind)).not.toContain(
        'leftover',
      )
    })

    it('leaves the vial being used and powder vials alone', () => {
      const runways = new Map([['old', vialRunway(0.3, doses)]])
      const kinds = stockAlerts([old, powder()], [], runways, now).map((a) => a.kind)
      expect(kinds).not.toContain('leftover')
      expect(kinds).toContain('reconstitute') // nothing else can take over yet
    })
  })

  it('sorts by severity, then date, with dateless alerts last', () => {
    const runways = new Map([['new', vialRunway(9, [{ at: at('2026-10-01'), doseMg: 1 }])]])
    const old = vial({ id: 'old', remaining_mg: 0.3, opened_at: '2026-09-20' })
    const fresh = vial({ id: 'new', remaining_mg: 9, opened_at: '2026-09-29' })
    const alerts = stockAlerts(
      [old, fresh, vial({ id: 'x', compound_id: 'ghk-cu', expires_at: '2026-09-25' })],
      [],
      runways,
      new Date('2026-09-30T08:00'),
    )
    expect(alerts.map((a) => a.kind)).toEqual(['expired', 'leftover'])
  })
})

describe('alert keys', () => {
  const base: StockAlert = {
    kind: 'expiresSoon',
    severity: 'warn',
    compoundIds: ['mots-c'],
    vialId: 'v1',
    date: new Date('2026-10-05T00:00'),
    days: 5,
  }

  it('is stable for the same situation however many days have gone by', () => {
    expect(alertKey(base)).toBe('expiresSoon:v1:warn:2026-10-05')
    expect(alertKey({ ...base, days: 2, label: 'otro nombre' })).toBe(alertKey(base))
  })

  it('is a new alert when the expiry date is edited or the alert escalates', () => {
    expect(alertKey({ ...base, date: new Date('2026-10-12T00:00') })).not.toBe(alertKey(base))
    expect(alertKey({ ...base, severity: 'danger' })).not.toBe(alertKey(base))
    expect(alertKey({ ...base, kind: 'expired' })).not.toBe(alertKey(base))
  })

  it('tells vials apart, and falls back to the substances without a vial', () => {
    expect(alertKey({ ...base, vialId: 'v2' })).not.toBe(alertKey(base))
    const reorder: StockAlert = {
      kind: 'reorder',
      severity: 'warn',
      compoundIds: ['ghk-cu', 'bpc-157'],
      date: new Date('2026-10-23T00:00'),
    }
    expect(alertKey(reorder)).toBe('reorder:ghk-cu+bpc-157:warn:2026-10-23')
  })

  it('does not bring back a run-out alert because the schedule moved its date', () => {
    const runsOut: StockAlert = {
      kind: 'runsOut',
      severity: 'warn',
      compoundIds: ['mots-c'],
      vialId: 'v1',
      date: new Date('2026-10-07T00:00'),
      doses: 1,
    }
    expect(alertKey({ ...runsOut, date: new Date('2026-10-09T00:00') })).toBe(alertKey(runsOut))
    // But the vial running dry is an escalation.
    expect(alertKey({ ...runsOut, severity: 'danger', doses: 0 })).not.toBe(alertKey(runsOut))
  })

  it('shows a leftover once per vial', () => {
    const leftover: StockAlert = {
      kind: 'leftover',
      severity: 'info',
      compoundIds: ['mots-c'],
      vialId: 'old',
      mg: 0.3,
    }
    expect(alertKey({ ...leftover, mg: 0.1 })).toBe(alertKey(leftover))
    expect(alertKey(leftover)).toBe('leftover:old:info:-')
  })

  it('fits the 200 characters the table allows', () => {
    const many = Array.from({ length: 40 }, (_, i) => `compound-number-${i}`)
    expect(alertKey({ ...base, vialId: undefined, compoundIds: many }).length).toBeLessThanOrEqual(
      200,
    )
  })
})

describe('marking alerts as read', () => {
  const a1: StockAlert = {
    kind: 'expiresSoon',
    severity: 'warn',
    compoundIds: ['mots-c'],
    vialId: 'v1',
    date: new Date('2026-10-05T00:00'),
  }
  const a2: StockAlert = { ...a1, kind: 'reorder', vialId: undefined, compoundIds: ['mots-c'] }

  it('keeps unread alerts active and moves the dismissed ones to read, in order', () => {
    const { active, read } = splitDismissed([a1, a2], new Set([alertKey(a1)]))
    expect(active).toEqual([a2])
    expect(read).toEqual([a1])
  })

  it('shows an alert again when its situation changed after it was read', () => {
    const keys = new Set([alertKey(a1)])
    const edited = { ...a1, date: new Date('2026-10-12T00:00') }
    expect(splitDismissed([edited], keys).active).toEqual([edited])
    expect(splitDismissed([{ ...a1, severity: 'danger' }], keys).active).toHaveLength(1)
  })

  it('has nothing to split without alerts or dismissals', () => {
    expect(splitDismissed([], new Set(['x']))).toEqual({ active: [], read: [] })
    expect(splitDismissed([a1], new Set()).active).toEqual([a1])
  })
})
