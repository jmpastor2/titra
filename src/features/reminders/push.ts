/**
 * Web Push on this device: capability checks, permission and the subscription that the
 * send-reminders Edge Function delivers to. iOS only allows it from the installed PWA
 * (Safari → Share → Add to Home Screen, iOS 16.4+).
 */
import { requireSupabase } from '@/lib/supabase'

export type PushSupport = 'ok' | 'ios-install' | 'unsupported'

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  )
}

export function pushSupport(): PushSupport {
  if (isIos() && !isStandalone()) return 'ios-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    return 'unsupported'
  return 'ok'
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

/** The active service worker, or null when none is registered (e.g. the dev server). */
export async function readyRegistration(
  timeoutMs = 4000,
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ])
}

function base64UrlToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export type PushErrorCode = 'no-key' | 'no-sw' | 'denied' | 'server'

export class PushError extends Error {
  readonly code: PushErrorCode
  constructor(code: PushErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

/** Ask for permission if needed, subscribe this browser and store it for the signed-in user. */
export async function subscribeThisDevice(vapidPublicKey: string | undefined): Promise<void> {
  if (!vapidPublicKey) throw new PushError('no-key')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushError('denied')
  const reg = await readyRegistration()
  if (!reg) throw new PushError('no-sw')

  const key = base64UrlToBytes(vapidPublicKey)
  let sub = await reg.pushManager.getSubscription()
  // A subscription made with another server key cannot receive our messages.
  const current = sub?.options.applicationServerKey
  if (sub && current && !sameBytes(new Uint8Array(current), key)) {
    await sub.unsubscribe()
    sub = null
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })

  const json = sub.toJSON()
  const { error } = await requireSupabase().rpc('save_push_subscription', {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh ?? '',
    p_auth: json.keys?.auth ?? '',
    p_user_agent: navigator.userAgent.slice(0, 300),
  })
  if (error) throw new PushError('server', error.message)
}

/** Stop push on this device and forget its subscription. */
export async function unsubscribeThisDevice(): Promise<void> {
  const reg = await readyRegistration(1500)
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await requireSupabase().from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

export async function isThisDeviceSubscribed(): Promise<boolean> {
  const reg = await readyRegistration(1500)
  return Boolean(await reg?.pushManager.getSubscription())
}

/** Show a notification through the service worker (required on mobile), else directly. */
export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { data?: { url: string } },
): Promise<boolean> {
  if (notificationPermission() !== 'granted') return false
  const reg = await readyRegistration(1500)
  const opts: NotificationOptions = {
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icons/badge-72.png`,
    ...options,
  }
  if (reg) {
    await reg.showNotification(title, opts)
    return true
  }
  const shown = new Notification(title, opts)
  return shown.title === title
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}
