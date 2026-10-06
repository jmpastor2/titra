import { Info, Smartphone, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Segmented, SubstanceDot, ToggleRow } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { useDoses, useInventory, useProtocols } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { env } from '@/lib/env'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { reminderText } from './format'
import { upcomingAdministrations } from './plan'
import {
  isThisDeviceSubscribed,
  notificationPermission,
  PushError,
  pushSupport,
  showLocalNotification,
  subscribeThisDevice,
  unsubscribeThisDevice,
} from './push'
import { useReminderPrefs, useReminderSyncState } from './useReminders'

const LEADS = ['0', '15', '30', '60'] as const
type Lead = (typeof LEADS)[number]

type DeviceState =
  'checking' | 'on' | 'off' | 'local' | 'denied' | 'no-sw' | 'ios-install' | 'unsupported'

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** Reminders: the switch, how early, this device and what is coming next. */
export function RemindersPanel() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { toast } = useToast()
  const { user } = useSession()
  const uid = user?.id ?? ''
  const prefs = useReminderPrefs()
  const protocols = useProtocols(uid)
  const doses = useDoses(uid, 120)
  const inventory = useInventory(uid)
  const sync = useReminderSyncState()
  const [device, setDevice] = useState<DeviceState>(() => {
    const support = pushSupport()
    if (support !== 'ok') return support
    return notificationPermission() === 'denied' ? 'denied' : 'checking'
  })
  const [busy, setBusy] = useState(false)

  const { enabled, serverReady } = prefs
  const lead = String(prefs.leadMin) as Lead

  // Whether this browser already holds a push subscription is only known asynchronously.
  const checking = device === 'checking'
  useEffect(() => {
    if (!checking) return
    let alive = true
    void isThisDeviceSubscribed().then((on) => alive && setDevice(on ? 'on' : 'off'))
    return () => {
      alive = false
    }
  }, [checking])

  const upcoming = useMemo(
    () =>
      upcomingAdministrations(
        protocols.data ?? [],
        doses.data ?? [],
        inventory.data ?? [],
        new Date(),
        { leadMin: Number(lead), horizonDays: 7 },
      ).slice(0, 4),
    [protocols.data, doses.data, inventory.data, lead],
  )

  async function enableDevice(): Promise<boolean> {
    try {
      await subscribeThisDevice(env.vapidPublicKey)
      setDevice('on')
      return true
    } catch (e) {
      const code = e instanceof PushError ? e.code : 'server'
      // Only a real "Don't allow" is sticky; a dismissed prompt can be asked again.
      if (code === 'denied') setDevice(notificationPermission() === 'denied' ? 'denied' : 'off')
      else if (code === 'no-sw') setDevice('no-sw')
      toast(t(`reminders.errors.${code}`), code === 'server' ? 'error' : 'warn')
      return false
    }
  }

  async function toggle(next: boolean) {
    setBusy(true)
    try {
      // iOS only shows the permission prompt while still inside the tap, so ask (and
      // subscribe) before any network round trip.
      if (next && !serverReady && 'Notification' in window) {
        // No push server yet: notifications still show while the app is open.
        const p = await Notification.requestPermission()
        setDevice(p === 'denied' ? 'denied' : 'local')
      } else if (next && device !== 'on' && device !== 'ios-install' && device !== 'unsupported')
        await enableDevice()
      await prefs.set({ enabled: next })
      toast(next ? t('reminders.enabled') : t('reminders.disabled'), 'success')
    } catch {
      toast(t('reminders.errors.server'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function changeLead(next: Lead) {
    await prefs.set({ leadMin: Number(next) })
  }

  async function test() {
    const first = upcoming[0]
    const text = first
      ? reminderText(first, Number(lead), t, locale)
      : { title: t('reminders.testTitle'), body: t('reminders.testBody') }
    const shown = await showLocalNotification(text.title, {
      body: text.body,
      tag: 'titra-test',
      data: { url: first ? `#/?log=${first.protocol.id}` : '#/' },
    })
    if (!shown) toast(t('reminders.errors.denied'), 'warn')
  }

  async function disableDevice() {
    setBusy(true)
    try {
      await unsubscribeThisDevice()
      setDevice('off')
    } finally {
      setBusy(false)
    }
  }

  const blocked = busy || prefs.saving || !prefs.loaded
  const deviceState = !serverReady && device !== 'denied' ? 'local' : device
  const canTest =
    device === 'on' ||
    notificationPermission() === 'granted' ||
    (!serverReady && device !== 'denied')

  return (
    <div className="flex flex-col gap-3">
      <ToggleRow
        tone={enabled ? 'signal' : 'default'}
        checked={enabled}
        label={t('reminders.toggle')}
        hint={t('reminders.toggleHint')}
        className={blocked ? 'pointer-events-none opacity-60' : undefined}
        onChange={(v) => void toggle(v)}
      />

      <p className="flex items-start gap-2 px-1 text-[12.5px] leading-snug text-muted">
        <TrendingUp className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t('reminders.decisionsHint')}
      </p>

      {enabled && (
        <>
          <Card title={t('reminders.lead')}>
            <Segmented<Lead>
              size="sm"
              value={lead}
              onChange={(v) => void changeLead(v)}
              options={LEADS.map((l) => ({
                value: l,
                label:
                  l === '0'
                    ? t('reminders.onTime')
                    : l === '60'
                      ? t('reminders.hourBefore')
                      : t('reminders.minutesBefore', { n: l }),
              }))}
            />
          </Card>

          <Card title={t('reminders.deviceTitle')}>
            <DeviceRow state={deviceState}>
              {canTest && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="soft" onClick={() => void test()}>
                    {t('reminders.test')}
                  </Button>
                  {device === 'on' && (
                    <Button size="sm" variant="ghost" loading={busy} onClick={disableDevice}>
                      {t('reminders.deviceOff')}
                    </Button>
                  )}
                </div>
              )}
              {serverReady && device === 'off' && (
                <Button
                  size="sm"
                  className="mt-3"
                  loading={busy}
                  onClick={async () => {
                    setBusy(true)
                    await enableDevice()
                    setBusy(false)
                  }}
                >
                  {t('reminders.deviceOn')}
                </Button>
              )}
            </DeviceRow>
            <p className="mt-3 flex items-start gap-2 text-[12px] leading-snug text-muted">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              {sync.kind === 'ok'
                ? t('reminders.serverOk', { count: sync.count })
                : sync.kind === 'missing'
                  ? t('reminders.serverMissing')
                  : sync.kind === 'error'
                    ? t('reminders.serverError', { message: sync.message })
                    : t('reminders.serverPending')}
            </p>
          </Card>

          {upcoming.length > 0 && (
            <Card padded={false}>
              <div className="spec px-4 pt-4">{t('reminders.next')}</div>
              <ul className="mt-2 divide-y divide-line px-4 pb-1">
                {upcoming.map((u) => (
                  <li
                    key={`${u.protocol.id}:${u.at.getTime()}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="w-[56px] shrink-0">
                      <span className="readout block text-[15px] font-semibold">
                        {hhmm(u.fireAt)}
                      </span>
                      <span className="spec block text-[9.5px]">
                        {fmtDate(u.fireAt, locale, 'EEE d')}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 items-start gap-2">
                      <span className="mt-1.5 flex shrink-0 gap-1">
                        {u.doses.map((d) => (
                          <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
                        ))}
                      </span>
                      <span className="text-[13.5px] font-semibold leading-snug">
                        {u.doses.map((d) => compoundById(d.compoundId)?.names.generic).join(' + ')}
                      </span>
                    </span>
                    {u.totalUnits !== null && (
                      <span className="readout shrink-0 text-[14px] font-semibold text-signal">
                        {fmtNumber(u.totalUnits, locale, 1)} U
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function DeviceRow({ state, children }: { state: DeviceState; children?: ReactNode }) {
  const { t } = useTranslation()
  const tone =
    state === 'on'
      ? 'text-signal'
      : state === 'checking' || state === 'off'
        ? 'text-ink-2'
        : 'text-warn'
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <Smartphone className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden />
        <div className="min-w-0">
          <div className={`text-[14px] font-semibold leading-snug ${tone}`}>
            {t(`reminders.device.${state}`)}
          </div>
          <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
            {t(`reminders.deviceHint.${state}`)}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
