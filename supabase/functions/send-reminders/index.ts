/**
 * Supabase Edge Function · send-reminders
 *
 * Called every 5 minutes by pg_cron (job 'titra-send-reminders', see
 * supabase/migrations/20260926000000_reminders.sql) with the header `x-cron-secret`
 * instead of a JWT, so it must be deployed with JWT verification off:
 *
 *   supabase functions deploy send-reminders --no-verify-jwt
 *
 * Secrets (Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
 * CRON_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
 *
 * `?dry=1` reports what would be sent and skipped without sending or writing anything.
 * Setup guide: docs/notificaciones.md.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpushModule from 'npm:web-push@3.6.7'
import {
  chunk,
  classifyPushResult,
  doseQueryWindow,
  IN_FILTER_CHUNK,
  MAX_REMINDERS_PER_RUN,
  planReminders,
  PUSH_TTL_SECONDS,
  safeEqual,
  settleReminder,
  staleCutoff,
  unique,
} from './plan.ts'
import type {
  DeliveryStatus,
  LoggedDose,
  PushSubscriptionRow,
  ReminderRow,
  RunSummary,
} from './plan.ts'

/** Parallel push requests in flight. */
const PUSH_CONCURRENCY = 10
/** Per-request timeout towards the push service. */
const PUSH_TIMEOUT_MS = 10_000

/** Service-role client: bypasses RLS. */
function createDb() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
type Db = ReturnType<typeof createDb>

/**
 * The part of web-push used here. web-push is CommonJS without bundled types (its
 * @types package has no default export), so the default import is typed by hand.
 */
type WebPush = {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  sendNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    options: { TTL: number; urgency: 'very-low' | 'low' | 'normal' | 'high'; timeout: number },
  ): Promise<{ statusCode: number }>
}
const webpush = webpushModule as unknown as WebPush

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function env(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`missing environment variable ${name}`)
  return value
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) return String(err.message)
  return String(err)
}

/** HTTP status of a web-push failure, if the push service answered at all. */
function pushErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'statusCode' in err && typeof err.statusCode === 'number') {
    return err.statusCode
  }
  return undefined
}

function endpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host
  } catch {
    return 'invalid-endpoint'
  }
}

async function forEachLimit<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++] as T
      // oxlint-disable-next-line no-await-in-loop -- each worker runs its share sequentially
      await fn(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
}

type DbResult = { data: unknown; error: unknown }

/** Run one query per chunk of ids (keeps `.in()` URLs short) and concatenate the rows. */
async function selectInChunks<T>(
  ids: readonly string[],
  query: (idsChunk: string[]) => PromiseLike<DbResult>,
): Promise<T[]> {
  const results = await Promise.all(chunk(ids, IN_FILTER_CHUNK).map((part) => query(part)))
  return results.flatMap(({ data, error }) => {
    if (error) throw error
    return (data ?? []) as T[]
  })
}

/** Run one write per chunk of ids and throw on the first error. */
async function writeInChunks(
  ids: readonly string[],
  write: (idsChunk: string[]) => PromiseLike<{ error: unknown }>,
): Promise<void> {
  const results = await Promise.all(chunk(unique(ids), IN_FILTER_CHUNK).map((part) => write(part)))
  for (const { error } of results) if (error) throw error
}

/** Stamp `column = at` on pending reminders with these ids. */
function markReminders(
  db: Db,
  ids: readonly string[],
  column: 'sent_at' | 'skipped_at',
  at: string,
): Promise<void> {
  return writeInChunks(ids, (part) =>
    db
      .from('reminders')
      .update({ [column]: at })
      .in('id', part)
      .is('sent_at', null)
      .is('skipped_at', null),
  )
}

async function run(dry: boolean): Promise<RunSummary & Record<string, unknown>> {
  const db = createDb()
  const now = new Date()
  const nowIso = now.toISOString()
  const cutoff = staleCutoff(now)

  // 1. Never-sent reminders older than the due window: mark skipped (count only if dry).
  let stale = 0
  if (dry) {
    const { count, error } = await db
      .from('reminders')
      .select('id', { count: 'exact', head: true })
      .is('sent_at', null)
      .is('skipped_at', null)
      .lte('fire_at', cutoff)
    if (error) throw error
    stale = count ?? 0
  } else {
    const { count, error } = await db
      .from('reminders')
      .update({ skipped_at: nowIso }, { count: 'exact' })
      .is('sent_at', null)
      .is('skipped_at', null)
      .lte('fire_at', cutoff)
    if (error) throw error
    stale = count ?? 0
  }

  // 2. Due reminders of users who turned reminders on.
  const { data: dueData, error: dueError } = await db.rpc('due_reminders', {
    p_now: nowIso,
    p_limit: MAX_REMINDERS_PER_RUN,
  })
  if (dueError) throw dueError
  const reminders = (dueData ?? []) as ReminderRow[]

  const summary: RunSummary = {
    dry,
    due: reminders.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    retrying: 0,
    prunedSubscriptions: 0,
    stale,
  }
  if (reminders.length === 0) return summary

  // 3. Batched reads: doses that could already cover these reminders, and devices.
  const userIds = unique(reminders.map((r) => r.user_id))
  const compoundIds = unique(reminders.map((r) => r.compound_id))
  const doseWindow = doseQueryWindow(reminders)
  const doses = doseWindow
    ? await selectInChunks<LoggedDose>(userIds, (ids) =>
        db
          .from('doses')
          .select('patient_id, compound_id, administered_at')
          .in('patient_id', ids)
          .in('compound_id', compoundIds)
          .gte('administered_at', doseWindow.from)
          .lte('administered_at', doseWindow.to),
      )
    : []
  const subscriptions = await selectInChunks<PushSubscriptionRow>(userIds, (ids) =>
    db.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', ids),
  )

  const plan = planReminders({ reminders, doses, subscriptions })

  if (dry) {
    summary.skipped = plan.skip.length
    return {
      ...summary,
      wouldSend: plan.send.map((s) => ({
        reminder_id: s.reminder.id,
        user_id: s.reminder.user_id,
        fire_at: s.reminder.fire_at,
        devices: s.subscriptions.length,
        payload: s.payload,
      })),
      wouldSkip: plan.skip,
    }
  }

  // 4. Send. One delivered device is enough; 404/410 prunes the subscription.
  if (plan.send.length > 0) {
    webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'))
  }

  const statuses: DeliveryStatus[][] = plan.send.map(() => [])
  const gone = new Set<string>()
  const jobs = plan.send.flatMap((send, index) =>
    send.subscriptions.map((subscription) => ({ index, send, subscription })),
  )

  await forEachLimit(jobs, PUSH_CONCURRENCY, async ({ index, send, subscription }) => {
    let status: DeliveryStatus
    if (gone.has(subscription.id)) {
      status = 'gone'
    } else {
      try {
        const res = await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(send.payload),
          { TTL: PUSH_TTL_SECONDS, urgency: 'high', timeout: PUSH_TIMEOUT_MS },
        )
        status = classifyPushResult(res.statusCode)
      } catch (err) {
        status = classifyPushResult(pushErrorStatus(err))
        if (status !== 'gone') {
          console.warn(
            JSON.stringify({
              event: 'push_failed',
              reminder_id: send.reminder.id,
              subscription_id: subscription.id,
              host: endpointHost(subscription.endpoint),
              status: pushErrorStatus(err) ?? null,
              error: errorMessage(err),
            }),
          )
        }
      }
    }
    if (status === 'gone') gone.add(subscription.id)
    else if (status !== 'delivered') summary.failed++
    statuses[index]?.push(status)
  })

  const sentIds: string[] = []
  const skippedIds = plan.skip.map((s) => s.reminderId)
  plan.send.forEach((send, index) => {
    const outcome = settleReminder(statuses[index] ?? [])
    if (outcome === 'sent') sentIds.push(send.reminder.id)
    else if (outcome === 'undeliverable') skippedIds.push(send.reminder.id)
    else summary.retrying++
  })

  // 5. Record the outcome.
  await Promise.all([
    markReminders(db, sentIds, 'sent_at', nowIso),
    markReminders(db, skippedIds, 'skipped_at', nowIso),
    writeInChunks([...gone], (part) => db.from('push_subscriptions').delete().in('id', part)),
  ])

  summary.sent = sentIds.length
  summary.skipped = skippedIds.length
  summary.prunedSubscriptions = gone.size
  return summary
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return json(405, { error: 'method_not_allowed' })
  }
  const expected = Deno.env.get('CRON_SECRET') ?? ''
  if (!expected) return json(500, { error: 'CRON_SECRET is not set' })
  if (!safeEqual(req.headers.get('x-cron-secret') ?? '', expected)) {
    return json(401, { error: 'unauthorized' })
  }

  const dry = new URL(req.url).searchParams.get('dry') === '1'
  try {
    const summary = await run(dry)
    // oxlint-disable-next-line no-console -- structured run log, read in the Supabase dashboard
    console.log(
      JSON.stringify({
        event: 'send_reminders',
        dry: summary.dry,
        due: summary.due,
        sent: summary.sent,
        skipped: summary.skipped,
        failed: summary.failed,
        retrying: summary.retrying,
        prunedSubscriptions: summary.prunedSubscriptions,
        stale: summary.stale,
      }),
    )
    return json(200, summary)
  } catch (err) {
    console.error(JSON.stringify({ event: 'send_reminders_error', error: errorMessage(err) }))
    return json(500, { error: errorMessage(err) })
  }
})
