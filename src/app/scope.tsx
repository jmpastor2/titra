import { createContext, useContext, type ReactNode } from 'react'
import type { ProfileRow } from '@/data/database.types'

/**
 * Which patient's data the current subtree renders and whether it is editable.
 * Patients see themselves (readOnly = false). Clinicians open a patient's
 * detail page with readOnly = true and canPrescribe = true.
 */
export interface PatientScope {
  patientId: string
  patient: ProfileRow | null
  isSelf: boolean
  readOnly: boolean
  canPrescribe: boolean
}

const Ctx = createContext<PatientScope | null>(null)

export function PatientScopeProvider({
  value,
  children,
}: {
  value: PatientScope
  children: ReactNode
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePatientScope(): PatientScope {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePatientScope must be used inside <PatientScopeProvider>')
  return v
}
