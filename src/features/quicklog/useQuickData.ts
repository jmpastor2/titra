import { useMemo } from 'react'
import { usePatientScope } from '@/app/scope'
import { useQuickMeasurements } from './data'
import { deriveQuickData } from './quickData'

/** The numbers behind the measurement tiles, for the person whose panel this is. */
export function useQuickData(now: Date) {
  const { patientId, patient } = usePatientScope()
  const { rows, pending } = useQuickMeasurements(patientId)
  const data = useMemo(() => deriveQuickData(rows, patient, now), [rows, patient, now])
  return { data, pending }
}
