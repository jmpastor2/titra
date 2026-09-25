import { useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import { useDoses, useInventory, useProfile, useProtocols, useUpdateProfile } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { requireSupabase } from '@/lib/supabase'
import { useLocale } from '@/lib/useLocale'
import { reminderText, toReminderInput } from './format'
import { fingerprint, upcomingAdministrations, type UpcomingAdministration } from './plan'
import { showLocalNotification } from './push'

const HOUR_MS = 3_600_000
/** Re-send even an unchanged plan this often, so the server window keeps moving forward. */
const RESYNC_MS = 6 * HOUR_MS
/** setTimeout cannot wait longer than this. */
const MAX_TIMEOUT_MS = 2_147_000_000

/* ------------------------------------------------------------ sync status */

export type SyncState =
  | { kind: 'idle' }
  | { kind: 'ok'; count: number; at: number }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }

let syncState: SyncState = { kind: 'idle' }
const listeners = new Set<() => void>()
function setSyncState(s: SyncState) {
  syncState = s
  listeners.forEach((l) => l())
}

/** Last result of sending the reminder plan to the server, for the settings screen. */
export function useReminderSyncState(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => syncState,
  )
}

function readStamp(key: string): { fp: string; at: number } | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as { fp: string; at: number }) : null
  } catch {
    return null
  }
}
function writeStamp(key: string, value: { fp: string; at: number } | null) {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value))
    else localStorage.removeItem(key)
  } catch {
    // Private mode: the next open simply syncs again.
  }
}

/** Force the next sync to go out even if the plan looks unchanged. */
export function invalidateReminderSync(userId: string) {
  writeStamp(`titra.reminders.${userId}`, null)
}

/* ------------------------------------------------------------ preferences */

interface LocalPrefs {
  enabled: boolean
  leadMin: number
}
const DEFAULT_PREFS: LocalPrefs = { enabled: false, leadMin: 0 }
const prefListeners = new Set<() => void>()
const prefCache = new Map<string, LocalPrefs>()

function readPrefs(key: string): LocalPrefs {
  const cached = prefCache.get(key)
  if (cached) return cached
  let value = DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(key)
    if (raw) value = { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LocalPrefs>) }
  } catch {
    // Unreadable storage: reminders start switched off.
  }
  prefCache.set(key, value)
  return value
}

function writePrefs(key: string, value: LocalPrefs) {
  prefCache.set(key, value)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode: the choice lasts for this session only.
  }
  prefListeners.forEach((l) => l())
}

/**
 * Whether reminders are on and how early. They live on the profile once migration 3 is
 * applied (so the push server can read them); until then, on this device only, which
 * still gives reminders while the app is open.
 */
export function useReminderPrefs() {
  const { user } = useSession()
  const uid = user?.id ?? ''
  const profile = useProfile(uid || undefined)
  const update = useUpdateProfile(uid)
  const key = `titra.reminderPrefs.${uid}`
  const local = useSyncExternalStore(
    (l) => {
      prefListeners.add(l)
      return () => prefListeners.delete(l)
    },
    () => readPrefs(key),
  )
  const serverReady = profile.data ? 'reminders_enabled' in profile.data : false

  async function set(patch: Partial<LocalPrefs>) {
    invalidateReminderSync(uid)
    if (!serverReady) return writePrefs(key, { ...local, ...patch })
    await update.mutateAsync({
      ...(patch.enabled !== undefined ? { reminders_enabled: patch.enabled } : {}),
      ...(patch.leadMin !== undefined ? { reminder_lead_minutes: patch.leadMin } : {}),
    })
  }

  return {
    loaded: Boolean(profile.data),
    serverReady,
    enabled: serverReady ? Boolean(profile.data?.reminders_enabled) : local.enabled,
    leadMin: serverReady ? (profile.data?.reminder_lead_minutes ?? 0) : local.leadMin,
    set,
    saving: update.isPending,
  }
}

/* ------------------------------------------------------------ data */

function useReminderInputs() {
  const { user } = useSession()
  const uid = user?.id
  const prefs = useReminderPrefs()
  const protocols = useProtocols(uid)
  const doses = useDoses(uid, 120)
  const inventory = useInventory(uid)
  const ready = Boolean(protocols.data && doses.data && inventory.data && prefs.loaded)
  return {
    uid,
    ready,
    serverReady: prefs.serverReady,
    enabled: prefs.enabled,
    leadMin: prefs.leadMin,
    protocols: protocols.data ?? [],
    doses: doses.data ?? [],
    vials: inventory.data ?? [],
  }
}

/* ------------------------------------------------------------ server plan */

/**
 * Keeps the server's reminder rows in step with the protocols, the doses already logged
 * and the vials in use. Runs on open and after any change, debounced; skips identical plans.
 */
export function useReminderSync() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { uid, ready, serverReady, enabled, leadMin, protocols, doses, vials } = useReminderInputs()

  useEffect(() => {
    if (!uid || !ready) return
    if (!serverReady) {
      setSyncState({ kind: 'missing' })
      return
    }
    const key = `titra.reminders.${uid}`
    const timer = setTimeout(() => {
      const rows = enabled
        ? upcomingAdministrations(protocols, doses, vials, new Date(), { leadMin }).map((u) =>
            toReminderInput(u, leadMin, t, locale),
          )
        : []
      const fp = fingerprint(rows.map((r) => [r.protocol_id, r.fire_at, r.title, r.body]))
      const prev = readStamp(key)
      // Nothing was ever sent and nothing needs to be: stay quiet.
      if (!enabled && !prev) return
      if (prev?.fp === fp && Date.now() - prev.at < RESYNC_MS) return
      void requireSupabase()
        .rpc('replace_reminders', { p_rows: rows })
        .then(({ error }) => {
          if (!error) {
            writeStamp(key, enabled ? { fp, at: Date.now() } : null)
            setSyncState({ kind: 'ok', count: rows.length, at: Date.now() })
          } else if (error.code === 'PGRST202' || error.code === '42883') {
            setSyncState({ kind: 'missing' })
          } else {
            setSyncState({ kind: 'error', message: error.message })
          }
        })
    }, 1200)
    return () => clearTimeout(timer)
  }, [uid, ready, serverReady, enabled, leadMin, protocols, doses, vials, t, locale])
}

/* ------------------------------------------------------------ while open */

/**
 * While the app is open, fire the next reminder on the device itself. Works before the
 * push server is set up; when it is, both use the same tag so the system shows one.
 */
export function useLocalReminders() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { toast } = useToast()
  const { ready, enabled, leadMin, protocols, doses, vials } = useReminderInputs()

  useEffect(() => {
    if (!ready || !enabled) return
    let timer: ReturnType<typeof setTimeout> | undefined

    const fire = (next: UpcomingAdministration) => {
      const firedKey = `titra.fired.${next.protocol.id}.${next.at.getTime()}`
      let fired = false
      try {
        fired = sessionStorage.getItem(firedKey) !== null
        sessionStorage.setItem(firedKey, '1')
      } catch {
        // No session storage: at worst the same reminder shows twice.
      }
      if (fired) return
      const { title, body } = reminderText(next, leadMin, t, locale)
      void showLocalNotification(title, {
        body,
        tag: `titra-${next.protocol.id}`,
        data: { url: `#/?log=${next.protocol.id}` },
      })
      if (document.visibilityState === 'visible') toast(`${title} · ${body}`, 'info')
    }

    // One timer at a time: fire the next administration, then look for the one after.
    const scheduleNext = () => {
      const next = upcomingAdministrations(protocols, doses, vials, new Date(), {
        leadMin,
        horizonDays: 2,
      })[0]
      if (!next) return
      const delay = next.fireAt.getTime() - Date.now()
      if (delay > MAX_TIMEOUT_MS) return
      timer = setTimeout(
        () => {
          fire(next)
          scheduleNext()
        },
        Math.max(0, delay),
      )
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [ready, enabled, leadMin, protocols, doses, vials, t, locale, toast])
}

/** A tap on a notification while the app is open arrives as a message from the worker. */
export function useNotificationNavigation() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (e: MessageEvent<{ type?: string; hash?: string }>) => {
      if (e.data?.type === 'titra:open' && e.data.hash) window.location.hash = e.data.hash
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])
}

/** Mounted once inside the signed-in shell. Renders nothing. */
export function ReminderAgent() {
  useReminderSync()
  useLocalReminders()
  useNotificationNavigation()
  return null
}
