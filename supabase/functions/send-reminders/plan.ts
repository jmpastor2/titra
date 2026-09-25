/**
 * Pure decision logic for the send-reminders Edge Function.
 *
 * No I/O and no Deno / npm: / jsr: imports, so the same file runs in the Supabase Edge
 * Runtime (imported by index.ts) and under Node in Vitest
 * (src/server/sendRemindersPlan.test.ts).
 */

/** Reminders that were due more than this long ago are never sent (marked skipped). */
export const DUE_WINDOW_MINUTES = 30
/** Upper bound of reminders handled in one run. */
export const MAX_REMINDERS_PER_RUN = 500
/** How long the push service keeps an undelivered notification. */
export const PUSH_TTL_SECONDS = 3600
/** Ids per `.in()` filter, to keep PostgREST URLs short. */
export const IN_FILTER_CHUNK = 100

const MINUTE_MS = 60_000

/** A row of public.reminders, as returned by public.due_reminders(). */
export type ReminderRow = {
  id: string
  user_id: string
  protocol_id: string
  occurrence_at: string
  fire_at: string
  compound_id: string
  title: string
  body: string
  url: string
  tolerance_minutes: number
}

/** The columns of public.doses needed to detect an already-logged administration. */
export type LoggedDose = {
  patient_id: string
  compound_id: string
  administered_at: string
}

/** The columns of public.push_subscriptions needed to send. */
export type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

/** JSON body of every push message; the service worker reads these fields. */
export type PushPayload = {
  title: string
  body: string
  url: string
  tag: string
  occurrence_at: string
}

export type SkipReason = 'already_logged' | 'no_subscriptions'

export type PlannedSend = {
  reminder: ReminderRow
  payload: PushPayload
  subscriptions: PushSubscriptionRow[]
}

export type ReminderPlan = {
  skip: { reminderId: string; reason: SkipReason }[]
  send: PlannedSend[]
}

/** Result of one push attempt to one subscription. */
export type DeliveryStatus = 'delivered' | 'gone' | 'transient' | 'rejected'

/** What to record for a reminder once all its push attempts are done. */
export type ReminderOutcome = 'sent' | 'retry' | 'undeliverable'

export type RunSummary = {
  dry: boolean
  /** Reminders due in this run (fire_at within the last DUE_WINDOW_MINUTES). */
  due: number
  /** Reminders delivered to at least one device and marked sent. */
  sent: number
  /** Due reminders marked skipped: dose already logged, no devices, or every device refused. */
  skipped: number
  /** Push attempts that failed for a reason other than an expired subscription. */
  failed: number
  /** Reminders left pending because every attempt failed transiently; retried next run. */
  retrying: number
  /** Subscriptions deleted after the push service answered 404 or 410. */
  prunedSubscriptions: number
  /** Older reminders that were never sent, marked skipped so they do not pile up. */
  stale: number
}

/** Everything older than this (and never sent) is stale. */
export function staleCutoff(now: Date): string {
  return new Date(now.getTime() - DUE_WINDOW_MINUTES * MINUTE_MS).toISOString()
}

export function buildPayload(reminder: ReminderRow): PushPayload {
  return {
    title: reminder.title,
    body: reminder.body,
    url: reminder.url || '/',
    tag: `titra-${reminder.protocol_id}`,
    occurrence_at: reminder.occurrence_at,
  }
}

const doseKey = (userId: string, compoundId: string) => `${userId}\u0000${compoundId}`

function toleranceMs(reminder: ReminderRow): number {
  const minutes = Number.isFinite(reminder.tolerance_minutes) ? reminder.tolerance_minutes : 0
  return Math.max(0, minutes) * MINUTE_MS
}

/** True when the user logged the reminder's compound within occurrence_at ± tolerance. */
export function isDoseLogged(reminder: ReminderRow, doses: readonly LoggedDose[]): boolean {
  const at = Date.parse(reminder.occurrence_at)
  if (Number.isNaN(at)) return false
  const tolerance = toleranceMs(reminder)
  return doses.some(
    (d) =>
      d.patient_id === reminder.user_id &&
      d.compound_id === reminder.compound_id &&
      Math.abs(Date.parse(d.administered_at) - at) <= tolerance,
  )
}

/**
 * Time range that covers every reminder's occurrence_at ± tolerance, for a single
 * batched doses query. Null when there is nothing to check.
 */
export function doseQueryWindow(
  reminders: readonly ReminderRow[],
): { from: string; to: string } | null {
  let from = Infinity
  let to = -Infinity
  for (const r of reminders) {
    const at = Date.parse(r.occurrence_at)
    if (Number.isNaN(at)) continue
    const tolerance = toleranceMs(r)
    from = Math.min(from, at - tolerance)
    to = Math.max(to, at + tolerance)
  }
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() }
}

/** Decide, for each due reminder, whether to skip it or which devices to push it to. */
export function planReminders(input: {
  reminders: readonly ReminderRow[]
  doses: readonly LoggedDose[]
  subscriptions: readonly PushSubscriptionRow[]
}): ReminderPlan {
  const dosesByKey = new Map<string, LoggedDose[]>()
  for (const d of input.doses) {
    const key = doseKey(d.patient_id, d.compound_id)
    const list = dosesByKey.get(key)
    if (list) list.push(d)
    else dosesByKey.set(key, [d])
  }

  const subsByUser = new Map<string, PushSubscriptionRow[]>()
  for (const s of input.subscriptions) {
    const list = subsByUser.get(s.user_id)
    if (list) list.push(s)
    else subsByUser.set(s.user_id, [s])
  }

  const plan: ReminderPlan = { skip: [], send: [] }
  const seen = new Set<string>()
  for (const reminder of input.reminders) {
    if (seen.has(reminder.id)) continue
    seen.add(reminder.id)

    const doses = dosesByKey.get(doseKey(reminder.user_id, reminder.compound_id)) ?? []
    if (isDoseLogged(reminder, doses)) {
      plan.skip.push({ reminderId: reminder.id, reason: 'already_logged' })
      continue
    }
    const subscriptions = subsByUser.get(reminder.user_id) ?? []
    if (subscriptions.length === 0) {
      plan.skip.push({ reminderId: reminder.id, reason: 'no_subscriptions' })
      continue
    }
    plan.send.push({ reminder, payload: buildPayload(reminder), subscriptions })
  }
  return plan
}

/**
 * Classify a push service answer. `undefined` means no HTTP answer at all (network
 * error or timeout). 404/410: the subscription is gone and must be deleted. 429/5xx:
 * try again later. Any other 4xx (bad VAPID key, payload too large…) will not get
 * better by retrying.
 */
export function classifyPushResult(statusCode: number | undefined): DeliveryStatus {
  if (statusCode === undefined || !Number.isFinite(statusCode)) return 'transient'
  if (statusCode >= 200 && statusCode < 300) return 'delivered'
  if (statusCode === 404 || statusCode === 410) return 'gone'
  if (statusCode === 408 || statusCode === 429 || statusCode >= 500) return 'transient'
  return 'rejected'
}

/**
 * One delivered device is enough to mark the reminder sent. If nothing was delivered
 * but some failure was transient, leave it pending so the next run retries it (until it
 * turns stale). Otherwise no device can receive it: mark it skipped.
 */
export function settleReminder(statuses: readonly DeliveryStatus[]): ReminderOutcome {
  if (statuses.includes('delivered')) return 'sent'
  if (statuses.includes('transient')) return 'retry'
  return 'undeliverable'
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('chunk size must be >= 1')
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export function unique<T>(items: Iterable<T>): T[] {
  return [...new Set(items)]
}

/** Constant-time string comparison for the cron secret (no early exit on mismatch). */
export function safeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0)
  }
  return diff === 0
}
