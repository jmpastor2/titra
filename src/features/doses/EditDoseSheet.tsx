import { Check, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { useDoses, useInventory, useProtocols, useUpdateDoses } from '@/data/hooks'
import { vialHas } from '@/features/inventory/vials'
import { SitePicker } from '@/features/sites/SitePicker'
import { fmtDateTime, fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { protocolOf, siteHistory, substanceLine, type Administration } from './administrations'
import { DoseLine } from './DoseLine'
import {
  buildEditPatches,
  editLines,
  editedMembers,
  type EditLine,
  type EditedLine,
} from './doseLines'
import { SlotPicker } from './SlotPicker'
import { useSlotAssignment } from './useSlotAssignment'

export interface EditDoseSheetProps {
  open: boolean
  onClose: () => void
  /** The administration to edit: a single row, or every row of a stack or blend. */
  administration: Administration | null
  /** Offers "Eliminar esta toma" at the end of the form. */
  onDelete?: (administration: Administration) => void
}

/**
 * Mounted only while open and once protocols, vials and history are loaded, so the form
 * starts from the saved dose (state lives in `useState` initialisers, not effects).
 */
export function EditDoseSheet({ open, onClose, administration, onDelete }: EditDoseSheetProps) {
  return open && administration ? (
    <EditDoseLoader administration={administration} onClose={onClose} onDelete={onDelete} />
  ) : null
}

function EditDoseLoader(props: {
  administration: Administration
  onClose: () => void
  onDelete?: (administration: Administration) => void
}) {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  const inventory = useInventory(patientId, true)
  if (protocols.isPending || doses.isPending || inventory.isPending) return null
  return <EditDoseForm {...props} />
}

function EditDoseForm({
  administration,
  onClose,
  onDelete,
}: {
  administration: Administration
  onClose: () => void
  onDelete?: (administration: Administration) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  const inventory = useInventory(patientId, true)
  const update = useUpdateDoses(patientId)

  const { rows } = administration
  const vials = useMemo(() => inventory.data ?? [], [inventory.data])
  const doseRows = useMemo(() => doses.data ?? [], [doses.data])
  const protocol = useMemo(() => protocolOf(rows, protocols.data ?? []), [rows, protocols.data])
  // When the form opened: fixed, so what counts as missed does not shift under the person.
  const [now] = useState(() => new Date())

  const [lines, setLines] = useState<EditLine[]>(() => editLines(rows, vials))
  const [initialDate] = useState(() => toDateInputValue(administration.at))
  const [initialTime] = useState(() => toTimeInputValue(administration.at))
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [siteId, setSiteId] = useState(() => rows[0]?.site_id ?? '')
  const [notes, setNotes] = useState(() => rows[0]?.notes ?? '')

  // Untouched, the saved moment stands exactly (the inputs have no seconds).
  const validAt = Boolean(date)
  const doseAt = useMemo(
    () =>
      !date || (date === initialDate && time === initialTime)
        ? administration.at
        : fromDateTimeInputs(date, time),
    [date, time, initialDate, initialTime, administration.at],
  )

  const plannedAt = useMemo(() => {
    const iso = rows.find((r) => r.planned_at)?.planned_at
    return iso ? new Date(iso) : null
  }, [rows])
  const slot = useSlotAssignment({
    protocol,
    doses: doseRows,
    excludeKey: administration.key,
    doseAt,
    now,
    current: plannedAt,
  })

  const sites = useMemo(
    () =>
      siteHistory(
        doseRows,
        rows.map((r) => r.id),
      ),
    [doseRows, rows],
  )
  const injectable =
    Boolean(rows[0]?.site_id) ||
    lines.some((l) => compoundById(l.compoundId)?.routes.some((r) => r === 'sc' || r === 'im'))

  /** The vials a line can move to: those holding everything the line draws, and its own. */
  const vialOptions = (l: EditLine): InventoryRow[] =>
    vials.filter(
      (v) =>
        [l.compoundId, ...l.partners].every((c) => vialHas(v, c)) &&
        (!v.archived || v.id === l.initial.inventoryId),
    )

  async function save() {
    if (!validAt) {
      toast(t('errors.required'), 'warn')
      return
    }
    const edited: EditedLine[] = []
    for (const l of lines) {
      const members = editedMembers(l, vials)
      if (!members) {
        toast(t('errors.positive'), 'warn')
        return
      }
      edited.push({ members, inventoryId: l.inventoryId })
    }
    const patches = buildEditPatches(
      {
        at: doseAt,
        siteId: injectable ? siteId : (rows[0]?.site_id ?? ''),
        notes,
        ...(slot
          ? {
              plannedAt: slot.plannedAt,
              // A free dose that covers an administration of a protocol belongs to it.
              ...(slot.plannedAt ? { protocolId: slot.protocol.id } : {}),
            }
          : {}),
        lines: edited,
      },
      vials,
    )
    if (patches.length === 0) {
      onClose()
      return
    }
    try {
      await update.mutateAsync(patches)
      toast(t('editDose.saved'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('editDose.title')}
      description={`${substanceLine(administration)} · ${fmtDateTime(administration.at, locale)}`}
      footer={
        <Button
          block
          size="lg"
          loading={update.isPending}
          leading={<Check className="size-5" />}
          onClick={save}
        >
          {t('editDose.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <Field label={t('doses.when')}>
          {() => (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                aria-label={t('common.date')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Input
                type="time"
                aria-label={t('common.time')}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          )}
        </Field>

        {slot && <SlotPicker assignment={slot} />}

        <div className="flex flex-col gap-2.5">
          <span className="spec">
            {lines.length > 1 ? t('doses.sameSyringe') : t('doses.substance')}
          </span>
          {lines.map((l) => {
            const members = editedMembers(l, vials)
            return (
              <DoseLine
                key={l.key}
                line={l}
                vials={vialOptions(l)}
                locale={locale}
                onChange={(p) =>
                  setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, ...p } : x)))
                }
                partnerDoses={l.partnerRows.map((row, i) => ({
                  compoundId: row.compound_id,
                  mg: members?.[i + 1]?.mg ?? null,
                }))}
                credit={{ inventoryId: l.initial.inventoryId, mg: Number(l.hostRow.dose_mg) }}
              />
            )
          })}
        </div>

        {injectable && (
          <Field label={t('doses.site')}>
            {() => (
              <SitePicker
                value={siteId}
                onChange={setSiteId}
                history={sites}
                now={doseAt}
                compoundId={rows[0]?.compound_id}
              />
            )}
          </Field>
        )}

        <Field label={`${t('common.notes')} · ${t('common.optional')}`}>
          {(id) => (
            <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          )}
        </Field>

        {onDelete && (
          <Button
            variant="ghost"
            className="self-start text-danger hover:text-danger"
            leading={<Trash2 className="size-4" />}
            onClick={() => onDelete(administration)}
          >
            {t('editDose.delete')}
          </Button>
        )}
      </div>
    </Sheet>
  )
}
