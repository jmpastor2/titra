import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  chunk,
  classifyPushResult,
  DUE_WINDOW_MINUTES,
  doseQueryWindow,
  isDoseLogged,
  planReminders,
  safeEqual,
  settleReminder,
  staleCutoff,
  unique,
} from '../../supabase/functions/send-reminders/plan.ts'
import type {
  LoggedDose,
  PushSubscriptionRow,
  ReminderRow,
} from '../../supabase/functions/send-reminders/plan.ts'

const reminder = (over: Partial<ReminderRow> = {}): ReminderRow => ({
  id: 'r1',
  user_id: 'u1',
  protocol_id: 'p1',
  occurrence_at: '2026-09-25T09:00:00.000Z',
  fire_at: '2026-09-25T08:45:00.000Z',
  compound_id: 'semaglutide',
  title: 'Semaglutida 0,25 mg',
  body: 'Toca tu dosis de las 11:00',
  url: '/today',
  tolerance_minutes: 240,
  ...over,
})

const dose = (over: Partial<LoggedDose> = {}): LoggedDose => ({
  patient_id: 'u1',
  compound_id: 'semaglutide',
  administered_at: '2026-09-25T08:30:00.000Z',
  ...over,
})

const sub = (over: Partial<PushSubscriptionRow> = {}): PushSubscriptionRow => ({
  id: 's1',
  user_id: 'u1',
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  p256dh: 'BPk',
  auth: 'xyz',
  ...over,
})

describe('buildPayload', () => {
  it('builds the push body with a per-protocol tag', () => {
    expect(buildPayload(reminder())).toEqual({
      title: 'Semaglutida 0,25 mg',
      body: 'Toca tu dosis de las 11:00',
      url: '/today',
      tag: 'titra-p1',
      occurrence_at: '2026-09-25T09:00:00.000Z',
    })
  })

  it('falls back to / when url is empty', () => {
    expect(buildPayload(reminder({ url: '' })).url).toBe('/')
  })
})

describe('isDoseLogged', () => {
  it('matches the same user and compound inside the tolerance, both sides inclusive', () => {
    const r = reminder({ tolerance_minutes: 60 })
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T08:00:00.000Z' })])).toBe(true)
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T10:00:00.000Z' })])).toBe(true)
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T10:00:00.001Z' })])).toBe(false)
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T07:59:59.999Z' })])).toBe(false)
  })

  it('ignores other users and other compounds', () => {
    const r = reminder()
    expect(isDoseLogged(r, [dose({ patient_id: 'u2' })])).toBe(false)
    expect(isDoseLogged(r, [dose({ compound_id: 'tirzepatide' })])).toBe(false)
  })

  it('accepts the +00:00 timestamps PostgREST returns', () => {
    const r = reminder({ occurrence_at: '2026-09-25T09:00:00+00:00', tolerance_minutes: 0 })
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T11:00:00+02:00' })])).toBe(true)
  })

  it('treats a zero or negative tolerance as exact time only', () => {
    const r = reminder({ tolerance_minutes: -30 })
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T09:00:00.000Z' })])).toBe(true)
    expect(isDoseLogged(r, [dose({ administered_at: '2026-09-25T09:01:00.000Z' })])).toBe(false)
  })
})

describe('doseQueryWindow', () => {
  it('covers every occurrence ± its tolerance', () => {
    const window = doseQueryWindow([
      reminder({ occurrence_at: '2026-09-25T09:00:00.000Z', tolerance_minutes: 60 }),
      reminder({ id: 'r2', occurrence_at: '2026-09-25T12:00:00.000Z', tolerance_minutes: 240 }),
    ])
    expect(window).toEqual({ from: '2026-09-25T08:00:00.000Z', to: '2026-09-25T16:00:00.000Z' })
  })

  it('is null when there is nothing to check', () => {
    expect(doseQueryWindow([])).toBeNull()
    expect(doseQueryWindow([reminder({ occurrence_at: 'not a date' })])).toBeNull()
  })
})

describe('planReminders', () => {
  it('skips reminders whose dose is already logged', () => {
    const plan = planReminders({ reminders: [reminder()], doses: [dose()], subscriptions: [sub()] })
    expect(plan.send).toEqual([])
    expect(plan.skip).toEqual([{ reminderId: 'r1', reason: 'already_logged' }])
  })

  it('skips reminders of users without devices', () => {
    const plan = planReminders({
      reminders: [reminder()],
      doses: [],
      subscriptions: [sub({ user_id: 'u2' })],
    })
    expect(plan.skip).toEqual([{ reminderId: 'r1', reason: 'no_subscriptions' }])
  })

  it('sends to every device of the reminder owner only', () => {
    const plan = planReminders({
      reminders: [reminder(), reminder({ id: 'r2', user_id: 'u2', protocol_id: 'p2' })],
      doses: [dose({ compound_id: 'tirzepatide' })],
      subscriptions: [sub(), sub({ id: 's2' }), sub({ id: 's3', user_id: 'u2' })],
    })
    expect(plan.skip).toEqual([])
    expect(plan.send.map((s) => [s.reminder.id, s.subscriptions.map((x) => x.id)])).toEqual([
      ['r1', ['s1', 's2']],
      ['r2', ['s3']],
    ])
    expect(plan.send[1]?.payload.tag).toBe('titra-p2')
  })

  it('checks each reminder against its own compound and occurrence', () => {
    const plan = planReminders({
      reminders: [
        reminder({
          id: 'morning',
          occurrence_at: '2026-09-25T07:00:00.000Z',
          tolerance_minutes: 60,
        }),
        reminder({ id: 'night', occurrence_at: '2026-09-25T20:00:00.000Z', tolerance_minutes: 60 }),
      ],
      doses: [dose({ administered_at: '2026-09-25T07:20:00.000Z' })],
      subscriptions: [sub()],
    })
    expect(plan.skip).toEqual([{ reminderId: 'morning', reason: 'already_logged' }])
    expect(plan.send.map((s) => s.reminder.id)).toEqual(['night'])
  })

  it('handles a reminder id only once', () => {
    const plan = planReminders({
      reminders: [reminder(), reminder()],
      doses: [],
      subscriptions: [sub()],
    })
    expect(plan.send).toHaveLength(1)
  })
})

describe('classifyPushResult', () => {
  it.each([
    [201, 'delivered'],
    [200, 'delivered'],
    [404, 'gone'],
    [410, 'gone'],
    [429, 'transient'],
    [408, 'transient'],
    [500, 'transient'],
    [503, 'transient'],
    [undefined, 'transient'],
    [400, 'rejected'],
    [403, 'rejected'],
    [413, 'rejected'],
  ] as const)('%s → %s', (status, expected) => {
    expect(classifyPushResult(status)).toBe(expected)
  })
})

describe('settleReminder', () => {
  it('is sent when at least one device got it', () => {
    expect(settleReminder(['gone', 'delivered', 'transient'])).toBe('sent')
  })
  it('retries when nothing was delivered but a failure was transient', () => {
    expect(settleReminder(['gone', 'transient'])).toBe('retry')
  })
  it('is undeliverable when every device is gone or refused it', () => {
    expect(settleReminder(['gone', 'rejected'])).toBe('undeliverable')
    expect(settleReminder([])).toBe('undeliverable')
  })
})

describe('helpers', () => {
  it('staleCutoff is the start of the due window', () => {
    expect(staleCutoff(new Date('2026-09-25T09:00:00.000Z'))).toBe(
      new Date(Date.parse('2026-09-25T09:00:00.000Z') - DUE_WINDOW_MINUTES * 60_000).toISOString(),
    )
  })

  it('chunk splits and keeps order', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 3)).toEqual([])
    expect(() => chunk([1], 0)).toThrow(RangeError)
  })

  it('unique keeps first occurrences', () => {
    expect(unique(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })

  it('safeEqual compares whole strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true)
    expect(safeEqual('abc123', 'abc124')).toBe(false)
    expect(safeEqual('abc', 'abc123')).toBe(false)
    expect(safeEqual('', 'x')).toBe(false)
    expect(safeEqual('', '')).toBe(true)
  })
})
