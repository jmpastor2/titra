import { CalendarCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useDoses, useProtocols } from '@/data/hooks'
import { fmtDateTime } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { protocolOf, substanceLine, type Administration } from './administrations'
import { SlotPicker } from './SlotPicker'
import { useAssignDose } from './useAssignDose'
import { useSlotAssignment } from './useSlotAssignment'

export interface AssignSlotSheetProps {
  open: boolean
  onClose: () => void
  administration: Administration | null
  /** The missed administration the dose most plausibly stands for: selected to start with. */
  suggested?: Date
}

/**
 * "Asignar a una toma perdida": an extra dose made to cover a planned administration that
 * was missed, so the log shows one taken (late) instead of one missed and one extra.
 */
export function AssignSlotSheet({
  open,
  onClose,
  administration,
  suggested,
}: AssignSlotSheetProps) {
  return open && administration ? (
    <AssignSlotLoader administration={administration} onClose={onClose} suggested={suggested} />
  ) : null
}

interface FormProps {
  administration: Administration
  onClose: () => void
  suggested: Date | undefined
}

function AssignSlotLoader(props: FormProps) {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  if (protocols.isPending || doses.isPending) return null
  return <AssignSlotForm {...props} />
}

function AssignSlotForm({ administration, onClose, suggested }: FormProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  const assign = useAssignDose(patientId)
  const [saving, setSaving] = useState(false)
  const [now] = useState(() => new Date())

  const { rows } = administration
  const doseRows = useMemo(() => doses.data ?? [], [doses.data])
  const slot = useSlotAssignment({
    protocol: protocolOf(rows, protocols.data ?? []),
    doses: doseRows,
    excludeKey: administration.key,
    doseAt: administration.at,
    now,
    // Opened to assign it: the suggested administration is selected, not "none".
    preferred: suggested ?? null,
  })

  async function save() {
    // Nothing chosen: it stays an extra.
    if (!slot?.selected.plannedAt) {
      onClose()
      return
    }
    setSaving(true)
    const ok = await assign(rows, slot.selected.slot, slot.protocol.id)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('editDose.assign.title')}
      description={`${substanceLine(administration)} · ${fmtDateTime(administration.at, locale)}`}
      footer={
        <Button
          block
          size="lg"
          loading={saving}
          leading={<CalendarCheck className="size-5" />}
          onClick={save}
        >
          {t('editDose.assign.save')}
        </Button>
      }
    >
      <div className="pb-2 pt-1">{slot && <SlotPicker assignment={slot} hideLabel />}</div>
    </Sheet>
  )
}
