import { WifiOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { PatientScopeProvider } from '@/app/scope'
import { useProfile } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { ReminderAgent } from '@/features/reminders/useReminders'
import { useOnline } from '@/lib/useOnline'
import { Splash } from './Splash'
import { TabBar } from './TabBar'

/**
 * Authenticated frame: gates on session + onboarding, scopes every screen to the
 * signed-in user's own control and renders the floating dock.
 */
export function AppShell() {
  useScrollMemory()
  const { status, user } = useSession()
  const profile = useProfile(user?.id)
  const online = useOnline()
  const { t } = useTranslation()

  if (status === 'loading') return <Splash />
  if (status === 'signed_out') return <Navigate to="/auth" replace />
  if (profile.isPending) return <Splash />
  if (profile.isError || !profile.data) return <Splash error={profile.error?.message} />
  if (!profile.data.onboarded) return <Navigate to="/onboarding" replace />

  const p = profile.data
  return (
    <PatientScopeProvider
      value={{ patientId: p.id, patient: p, isSelf: true, readOnly: false, canPrescribe: false }}
    >
      <div className="min-h-dvh">
        {!online && (
          <div className="safe-top flex items-center justify-center gap-2 bg-warn-soft px-4 py-1.5 text-[12.5px] font-medium text-warn">
            <WifiOff className="size-3.5" /> {t('common.offline')}
          </div>
        )}
        <main className="mx-auto w-full max-w-2xl px-4 pb-32">
          <Outlet />
        </main>
        <TabBar />
        <ReminderAgent />
      </div>
    </PatientScopeProvider>
  )
}

/**
 * New screens start at the top; going back returns to where you were. HashRouter has no
 * data-router ScrollRestoration, so positions are kept per history entry here.
 */
function useScrollMemory() {
  const location = useLocation()
  const navType = useNavigationType()
  const positions = useRef(new Map<string, number>())

  useEffect(() => {
    const key = location.key
    const saved = positions.current.get(key)
    window.scrollTo(0, navType === 'POP' && saved !== undefined ? saved : 0)
    const onScroll = () => positions.current.set(key, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.key, navType])
}
