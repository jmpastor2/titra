import { usePatientScope } from '@/app/scope'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ClinicPage } from './ClinicPage'

/** The "/" route renders the patient dashboard or the clinician panel by role. */
export function HomeRoute() {
  const { patient } = usePatientScope()
  return patient?.role === 'clinician' ? <ClinicPage /> : <DashboardPage />
}
