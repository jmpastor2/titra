import { describe, expect, it } from 'vitest'
import { toProtocolLike } from '@/data/mappers'
import { slotChoices } from '@/domain/dosing/assign'
import { scheduledDoses, type PlannedDose } from '@/domain/dosing/schedule'
import type { DoseEvent } from '@/domain/types'
import {
  buildSlotView,
  consequenceOf,
  makeUpSlot,
  selectedOption,
  slotParts,
  suggestSlot,
} from './slotView'
import { cjcProtocol } from './testData'

const d = (iso: string) => new Date(iso)
const pl = toProtocolLike(cjcProtocol)

// Everything taken on time since the start, except Monday 29's and Friday 3's night.
const missedAt = new Set([d('2026-09-29T01:00').getTime(), d('2026-10-03T01:00').getTime()])
const history: DoseEvent[] = scheduledDoses(pl, d('2026-09-20T00:00'), d('2026-10-04T00:00'))
  .filter((s) => !missedAt.has(s.at.getTime()))
  .map((s) => ({ at: s.at, mg: s.doseMg }))

const now = d('2026-10-04T09:00')
const lateDose = d('2026-10-04T08:00')

describe('buildSlotView', () => {
  it('offers an extra and every missed night, the latest recommended for a late make-up', () => {
    const view = buildSlotView({
      choices: slotChoices(pl, history, lateDose, now),
      doseAt: lateDose,
    })

    expect(view.options.map((o) => o.kind)).toEqual(['extra', 'missed', 'missed'])
    expect(view.options.slice(1).map((o) => o.slot?.at)).toEqual([
      d('2026-10-03T01:00'),
      d('2026-09-29T01:00'),
    ])
    expect(view.options.map((o) => o.recommended)).toEqual([false, true, false])
    // Logging a late dose selects the recommended night; saving it assigns that slot.
    const picked = selectedOption(view, null)
    expect(picked.key).toBe(view.options[1]?.key)
    expect(picked.plannedAt).toEqual(d('2026-10-03T01:00'))
  })

  it('lands a dose taken on time on its own slot, with no older night to cover instead', () => {
    const doseAt = d('2026-10-03T01:05')
    const view = buildSlotView({
      choices: slotChoices(pl, history, doseAt, d('2026-10-03T01:30')),
      doseAt,
    })

    // Monday's night is still missed, but a dose that has its own night is not offered it:
    // a second dose, landing on nothing, would be the make-up.
    expect(view.options.map((o) => o.kind)).toEqual(['auto'])
    expect(view.options[0].slot?.at).toEqual(d('2026-10-03T01:00'))
    expect(selectedOption(view, null).plannedAt).toBeNull()
  })

  it('still offers the older nights when editing a dose that lands on its own', () => {
    const doseAt = d('2026-10-03T01:05')
    const view = buildSlotView({
      choices: slotChoices(pl, history, doseAt, d('2026-10-03T01:30')),
      doseAt,
      current: null,
    })
    expect(view.options.map((o) => o.kind)).toEqual(['auto', 'missed'])
    expect(selectedOption(view, null).kind).toBe('auto')
    expect(view.options.some((o) => o.recommended)).toBe(false)
  })

  it('preselects the administration the person came to log, whatever else is on offer', () => {
    const view = buildSlotView({
      choices: slotChoices(pl, history, lateDose, now),
      doseAt: lateDose,
      preferred: d('2026-09-29T01:00'),
    })
    expect(selectedOption(view, null).plannedAt).toEqual(d('2026-09-29T01:00'))
  })

  it('offers the night the person came to log even when the dose lands on another by its time', () => {
    // Opened for Monday's missed night, taken Friday 01:05: it lands on Friday's by itself.
    const doseAt = d('2026-10-03T01:05')
    const view = buildSlotView({
      choices: slotChoices(pl, history, doseAt, d('2026-10-03T01:30')),
      doseAt,
      preferred: d('2026-09-29T01:00'),
    })
    expect(view.options.map((o) => o.kind)).toEqual(['auto', 'missed'])
    expect(selectedOption(view, null).plannedAt).toEqual(d('2026-09-29T01:00'))
  })

  it('does not preselect a slot that is not on offer', () => {
    const view = buildSlotView({
      choices: slotChoices(pl, history, lateDose, now),
      doseAt: lateDose,
      preferred: d('2026-09-30T01:00'), // already covered by another dose
    })
    expect(selectedOption(view, null).plannedAt).toEqual(d('2026-10-03T01:00'))
  })

  it('keeps what the dose already is when editing, and only hints the recommendation', () => {
    const choices = slotChoices(pl, history, lateDose, now)

    const extra = buildSlotView({ choices, doseAt: lateDose, current: null })
    expect(selectedOption(extra, null).kind).toBe('extra')
    expect(extra.options[1]?.recommended).toBe(true)

    const assigned = buildSlotView({ choices, doseAt: lateDose, current: d('2026-09-29T01:00') })
    const picked = selectedOption(assigned, null)
    expect(picked.kind).toBe('current')
    expect(picked.plannedAt).toEqual(d('2026-09-29T01:00'))
    expect(consequenceOf(picked, lateDose).kind).toBe('same')
  })

  it('keeps an old assignment selectable when it is no longer among the missed ones', () => {
    const stale = d('2026-09-10T01:00') // before the protocol started
    const view = buildSlotView({
      choices: slotChoices(pl, history, lateDose, now),
      doseAt: lateDose,
      current: stale,
    })
    const picked = selectedOption(view, null)
    expect(picked.kind).toBe('current')
    expect(picked.plannedAt).toEqual(stale)
    expect(view.options.map((o) => o.kind)).toEqual(['extra', 'missed', 'missed', 'current'])
  })

  it('falls back to the default when the choice is no longer on offer', () => {
    const view = buildSlotView({
      choices: slotChoices(pl, history, lateDose, now),
      doseAt: lateDose,
    })
    expect(selectedOption(view, 'nope').key).toBe(view.defaultKey)
    expect(selectedOption(view, 'extra').kind).toBe('extra')
  })
})

describe('consequenceOf', () => {
  const view = buildSlotView({ choices: slotChoices(pl, history, lateDose, now), doseAt: lateDose })

  it('says an extra changes nothing', () => {
    expect(consequenceOf(view.options[0], lateDose)).toEqual({ kind: 'extra' })
  })

  it('measures how late a make-up is against the administration it covers', () => {
    const monday = view.options[2]!
    const c = consequenceOf(monday, lateDose)
    expect(c.kind).toBe('makeUp')
    // Monday's 01:00 to Sunday's 08:00: five days and seven hours.
    expect(c).toMatchObject({ deltaMin: 5 * 24 * 60 + 7 * 60 })
  })

  it('reports where a dose on time lands by itself', () => {
    const doseAt = d('2026-10-03T01:05')
    const onTime = buildSlotView({
      choices: slotChoices(pl, history, doseAt, d('2026-10-03T01:30')),
      doseAt,
    })
    expect(consequenceOf(onTime.options[0], doseAt)).toMatchObject({ kind: 'auto', deltaMin: 5 })
  })
})

describe('suggestSlot', () => {
  const slot = (iso: string): PlannedDose => ({ at: d(iso), doseMg: 0.1, stepIndex: 0 })
  const missed = [slot('2026-10-03T01:00'), slot('2026-09-29T01:00')]

  it('makes up the most recent missed administration before the dose', () => {
    expect(makeUpSlot(missed, lateDose)?.at).toEqual(d('2026-10-03T01:00'))
    expect(suggestSlot(missed, lateDose)?.at).toEqual(d('2026-10-03T01:00'))
  })

  it('skips administrations that come after the dose', () => {
    expect(makeUpSlot(missed, d('2026-10-01T12:00'))?.at).toEqual(d('2026-09-29T01:00'))
  })

  it('offers the closest one after a dose taken ahead of time', () => {
    const dose = d('2026-09-28T12:00')
    expect(makeUpSlot(missed, dose)).toBeNull()
    expect(suggestSlot(missed, dose)?.at).toEqual(d('2026-09-29T01:00'))
  })

  it('has no suggestion without a missed administration', () => {
    expect(suggestSlot([], lateDose)).toBeNull()
  })
})

describe('slotParts', () => {
  it('reads a night slot as the evening it belongs to', () => {
    const night = scheduledDoses(pl, d('2026-09-29T00:00'), d('2026-09-30T00:00'))[0]!
    expect(night.at).toEqual(d('2026-09-29T01:00'))
    const parts = slotParts(night)
    expect(parts.night).toBe(true)
    expect(parts.clock).toBe('01:00')
    expect(parts.day).toEqual(d('2026-09-28T00:00'))
  })

  it('keeps a daytime slot on its own day', () => {
    const parts = slotParts({ at: d('2026-10-05T09:00') })
    expect(parts).toMatchObject({ night: false, clock: '09:00' })
    expect(parts.day).toEqual(d('2026-10-05T00:00'))
  })
})
