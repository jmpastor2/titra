import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { PatientScopeProvider } from '@/app/scope'
import { useProfile } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { useOnline } from '@/lib/useOnline'
import { Splash } from './Splash'
import { TabBar } from './TabBar'

/**
 * Authenticated frame: gates on session + onboarding, provides the patient
 * scope (self) and renders the bottom tab bar.
 */
export function AppShell() {
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
      <div className="min-h-dvh bg-bg">
        {!online && (
          <div className="safe-top flex items-center justify-center gap-2 bg-warn-soft px-4 py-1.5 text-[12.5px] font-medium text-warn">
            <WifiOff className="size-3.5" /> {t('common.offline')}
          </div>
        )}
        <main className="mx-auto w-full max-w-2xl px-4 pb-28">
          <Outlet />
        </main>
        <TabBar role={p.role} />
      </div>
    </PatientScopeProvider>
  )
}
