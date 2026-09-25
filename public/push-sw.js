/*
 * Titra · dose reminders. Imported by the Workbox service worker (see vite.config.ts).
 * Payload from supabase/functions/send-reminders: { title, body, url, tag, occurrence_at }.
 * `url` is relative to the app scope, e.g. "#/?log=<protocolId>".
 */
/* eslint-env serviceworker */

const scoped = (path) => new URL(path || '', self.registration.scope).href

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const at = data.occurrence_at ? Date.parse(data.occurrence_at) : NaN
  event.waitUntil(
    self.registration.showNotification(data.title || 'Titra', {
      body: data.body || '',
      tag: data.tag || 'titra',
      renotify: true,
      icon: scoped('icons/icon-192.png'),
      badge: scoped('icons/badge-72.png'),
      timestamp: Number.isFinite(at) ? at : Date.now(),
      data: { url: data.url || '' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || ''
  const target = scoped(url)
  const hash = new URL(target).hash
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((c) => c.url.startsWith(self.registration.scope))
      if (open) {
        await open.focus()
        // The app routes by hash: let it navigate in place instead of reloading.
        // Client.postMessage has no targetOrigin: the client is same-origin by definition.
        // oxlint-disable-next-line unicorn/require-post-message-target-origin
        open.postMessage({ type: 'titra:open', hash })
        return
      }
      await self.clients.openWindow(target)
    })(),
  )
})
