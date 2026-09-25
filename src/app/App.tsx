import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Splash } from '@/components/layout/Splash'
import { LoginPage } from '@/features/auth/LoginPage'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { SetupPage } from '@/features/auth/SetupPage'
import { TodayPage } from '@/features/today/TodayPage'
import { env } from '@/lib/env'
import { Providers } from './providers'
import { UpdatePrompt } from './UpdatePrompt'

// Route-level code splitting: "Hoy" is the daily path and ships in the main bundle;
// everything else loads on demand.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const DosesPage = named(() => import('@/features/doses/DosesPage'), 'DosesPage')
const HealthPage = named(() => import('@/features/health/HealthPage'), 'HealthPage')
const WikiPage = named(() => import('@/features/wiki/WikiPage'), 'WikiPage')
const CompoundPage = named(() => import('@/features/wiki/CompoundPage'), 'CompoundPage')
const SubstancePage = named(() => import('@/features/substance/SubstancePage'), 'SubstancePage')
const MorePage = named(() => import('@/features/more/MorePage'), 'MorePage')
const ProtocolsPage = named(() => import('@/features/protocols/ProtocolsPage'), 'ProtocolsPage')
const ProtocolEditorPage = named(
  () => import('@/features/protocols/ProtocolEditorPage'),
  'ProtocolEditorPage',
)
const InventoryPage = named(() => import('@/features/inventory/InventoryPage'), 'InventoryPage')
const CalculatorPage = named(() => import('@/features/calculator/CalculatorPage'), 'CalculatorPage')
const SitesPage = named(() => import('@/features/sites/SitesPage'), 'SitesPage')
const SimulatorPage = named(() => import('@/features/simulator/SimulatorPage'), 'SimulatorPage')
const SettingsPage = named(() => import('@/features/settings/SettingsPage'), 'SettingsPage')
const RemindersPage = named(() => import('@/features/reminders/RemindersPage'), 'RemindersPage')
const OutlookPage = named(() => import('@/features/outlook/OutlookPage'), 'OutlookPage')
const ExportPage = named(() => import('@/features/settings/ExportPage'), 'ExportPage')
const SharePage = named(() => import('@/features/share/SharePage'), 'SharePage')
const PatientDetailPage = named(
  () => import('@/features/clinic/PatientDetailPage'),
  'PatientDetailPage',
)

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Splash />}>{children}</Suspense>
}

const page = (el: ReactNode) => <Lazy>{el}</Lazy>

// HashRouter: GitHub Pages has no server-side rewrite, and a hash route also
// survives being installed to the iOS home screen from any deep link.
const router = createHashRouter([
  { path: '/auth', element: <LoginPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'log', element: page(<DosesPage />) },
      { path: 'progress', element: page(<HealthPage />) },
      { path: 'health', element: <Navigate to="/progress" replace /> },
      { path: 'wiki', element: page(<WikiPage />) },
      { path: 'wiki/:compoundId', element: page(<CompoundPage />) },
      { path: 'substance/:compoundId', element: page(<SubstancePage />) },
      { path: 'more', element: page(<MorePage />) },
      { path: 'protocols', element: page(<ProtocolsPage />) },
      { path: 'protocols/new', element: page(<ProtocolEditorPage />) },
      { path: 'protocols/:protocolId', element: page(<ProtocolEditorPage />) },
      { path: 'inventory', element: page(<InventoryPage />) },
      { path: 'calculator', element: page(<CalculatorPage />) },
      { path: 'sites', element: page(<SitesPage />) },
      { path: 'simulator', element: page(<SimulatorPage />) },
      { path: 'settings', element: page(<SettingsPage />) },
      { path: 'reminders', element: page(<RemindersPage />) },
      { path: 'outlook', element: page(<OutlookPage />) },
      { path: 'export', element: page(<ExportPage />) },
      { path: 'share', element: page(<SharePage />) },
      { path: 'shared/:patientId', element: page(<PatientDetailPage />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  if (!env.isSupabaseConfigured) return <SetupPage />
  return (
    <Providers>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </Providers>
  )
}
