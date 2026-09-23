import { lazy, Suspense } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Splash } from '@/components/layout/Splash'
import { LoginPage } from '@/features/auth/LoginPage'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { SetupPage } from '@/features/auth/SetupPage'
import { HomeRoute } from '@/features/clinic/HomeRoute'
import { DosesPage } from '@/features/doses/DosesPage'
import { env } from '@/lib/env'
import { Providers } from './providers'
import { UpdatePrompt } from './UpdatePrompt'

// Route-level code splitting: the home screen and dose log ship in the main bundle
// (they are the daily path); everything else loads on demand.
const HealthPage = lazy(() =>
  import('@/features/health/HealthPage').then((m) => ({ default: m.HealthPage })),
)
const WikiPage = lazy(() =>
  import('@/features/wiki/WikiPage').then((m) => ({ default: m.WikiPage })),
)
const CompoundPage = lazy(() =>
  import('@/features/wiki/CompoundPage').then((m) => ({ default: m.CompoundPage })),
)
const MorePage = lazy(() =>
  import('@/features/more/MorePage').then((m) => ({ default: m.MorePage })),
)
const ProtocolsPage = lazy(() =>
  import('@/features/protocols/ProtocolsPage').then((m) => ({ default: m.ProtocolsPage })),
)
const ProtocolEditorPage = lazy(() =>
  import('@/features/protocols/ProtocolEditorPage').then((m) => ({
    default: m.ProtocolEditorPage,
  })),
)
const InventoryPage = lazy(() =>
  import('@/features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
)
const CalculatorPage = lazy(() =>
  import('@/features/calculator/CalculatorPage').then((m) => ({ default: m.CalculatorPage })),
)
const SitesPage = lazy(() =>
  import('@/features/sites/SitesPage').then((m) => ({ default: m.SitesPage })),
)
const SimulatorPage = lazy(() =>
  import('@/features/simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const ExportPage = lazy(() =>
  import('@/features/settings/ExportPage').then((m) => ({ default: m.ExportPage })),
)
const ClinicianLinkPage = lazy(() =>
  import('@/features/clinic/ClinicianLinkPage').then((m) => ({ default: m.ClinicianLinkPage })),
)
const PatientDetailPage = lazy(() =>
  import('@/features/clinic/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })),
)

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Splash />}>{children}</Suspense>
}

// HashRouter: GitHub Pages has no server-side rewrite, and a hash route also
// survives being installed to the iOS home screen from any deep link.
const router = createHashRouter([
  { path: '/auth', element: <LoginPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'log', element: <DosesPage /> },
      {
        path: 'health',
        element: (
          <Lazy>
            <HealthPage />
          </Lazy>
        ),
      },
      {
        path: 'wiki',
        element: (
          <Lazy>
            <WikiPage />
          </Lazy>
        ),
      },
      {
        path: 'wiki/:compoundId',
        element: (
          <Lazy>
            <CompoundPage />
          </Lazy>
        ),
      },
      {
        path: 'more',
        element: (
          <Lazy>
            <MorePage />
          </Lazy>
        ),
      },
      {
        path: 'protocols',
        element: (
          <Lazy>
            <ProtocolsPage />
          </Lazy>
        ),
      },
      {
        path: 'protocols/new',
        element: (
          <Lazy>
            <ProtocolEditorPage />
          </Lazy>
        ),
      },
      {
        path: 'protocols/:protocolId',
        element: (
          <Lazy>
            <ProtocolEditorPage />
          </Lazy>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Lazy>
            <InventoryPage />
          </Lazy>
        ),
      },
      {
        path: 'calculator',
        element: (
          <Lazy>
            <CalculatorPage />
          </Lazy>
        ),
      },
      {
        path: 'sites',
        element: (
          <Lazy>
            <SitesPage />
          </Lazy>
        ),
      },
      {
        path: 'simulator',
        element: (
          <Lazy>
            <SimulatorPage />
          </Lazy>
        ),
      },
      {
        path: 'settings',
        element: (
          <Lazy>
            <SettingsPage />
          </Lazy>
        ),
      },
      {
        path: 'export',
        element: (
          <Lazy>
            <ExportPage />
          </Lazy>
        ),
      },
      {
        path: 'clinician',
        element: (
          <Lazy>
            <ClinicianLinkPage />
          </Lazy>
        ),
      },
      {
        path: 'patients/:patientId',
        element: (
          <Lazy>
            <PatientDetailPage />
          </Lazy>
        ),
      },
      {
        path: 'patients/:patientId/:tab',
        element: (
          <Lazy>
            <PatientDetailPage />
          </Lazy>
        ),
      },
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
