import { startOfDay } from 'date-fns'
import { useMemo } from 'react'
import { usePatientScope } from '@/app/scope'
import { useProtocols } from '@/data/hooks'
import { useNow } from '@/lib/useNow'
import { activeCycles, type ProtocolCycle } from './items'

/**
 * The cycle of every active protocol of the patient in scope: `{ protocol, info }` with the
 * week, the step and the next change (see `cycleInfo`). A cycle only moves with the calendar
 * day, so it is worked out again when the day or the protocols change, not every minute.
 */
export function useCycleInfos(now?: Date): ProtocolCycle[] {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const clock = useNow()
  const day = startOfDay(now ?? clock).getTime()
  return useMemo(() => activeCycles(protocols.data ?? [], new Date(day)), [protocols.data, day])
}
