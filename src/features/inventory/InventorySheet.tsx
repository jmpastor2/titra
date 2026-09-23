import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { COMPOUNDS } from '@/content/compounds'
import type { InventoryForm, InventoryRow } from '@/data/database.types'
import { useSaveInventory } from '@/data/hooks'

const FORMS: InventoryForm[] = ['pen', 'vial', 'cartridge', 'tablet']

interface Props {
  open: boolean
  onClose: () => void
  editing: InventoryRow | null
}

/** Mounted only while open; initial values come from the row being edited. */
export function InventorySheet({ open, onClose, editing }: Props) {
  return open ? <InventoryForm onClose={onClose} editing={editing} /> : null
}

function InventoryForm({ onClose, editing }: Omit<Props, 'open'>) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const save = useSaveInventory(patientId)

  const [compoundId, setCompoundId] = useState(editing?.compound_id ?? 'semaglutide')
  const [form, setForm] = useState<InventoryForm>(editing?.form ?? 'pen')
  const [label, setLabel] = useState(editing?.label ?? '')
  const [total, setTotal] = useState(editing ? String(editing.total_mg) : '')
  const [remaining, setRemaining] = useState(editing ? String(editing.remaining_mg) : '')
  const [concentration, setConcentration] = useState(
    editing?.concentration_mg_per_ml ? String(editing.concentration_mg_per_ml) : '',
  )
  const [openedAt, setOpenedAt] = useState(editing?.opened_at ?? '')
  const [expiresAt, setExpiresAt] = useState(editing?.expires_at ?? '')
  const [lot, setLot] = useState(editing?.lot ?? '')
  const [storage, setStorage] = useState(editing?.storage_notes ?? '')

  async function submit() {
    const tot = Number(total.replace(',', '.'))
    const rem = remaining.trim() === '' ? tot : Number(remaining.replace(',', '.'))
    if (!(tot > 0)) {
      toast(t('errors.positive'), 'warn')
      return
    }
    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        patient_id: patientId,
        compound_id: compoundId,
        form,
        label:
          label.trim() || COMPOUNDS.find((c) => c.id === compoundId)?.names.generic || compoundId,
        total_mg: tot,
        remaining_mg: Math.max(0, rem),
        concentration_mg_per_ml: concentration ? Number(concentration.replace(',', '.')) : null,
        opened_at: openedAt || null,
        expires_at: expiresAt || null,
        lot: lot.trim() || null,
        storage_notes: storage.trim() || null,
      })
      toast(t('common.saved'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      tall
      title={editing ? t('inventory.edit') : t('inventory.add')}
      footer={
        <Button block size="lg" loading={save.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <Field label={t('doses.compound')}>
          {(id) => (
            <Select id={id} value={compoundId} onChange={(e) => setCompoundId(e.target.value)}>
              {COMPOUNDS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.names.generic}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('inventory.form')}>
          {(id) => (
            <Select id={id} value={form} onChange={(e) => setForm(e.target.value as InventoryForm)}>
              {FORMS.map((f) => (
                <option key={f} value={f}>
                  {t(`inventory.forms.${f}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('inventory.label')}>
          {(id) => (
            <Input
              id={id}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('inventory.labelPlaceholder')}
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('inventory.totalMg')}>
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                suffix="mg"
              />
            )}
          </Field>
          <Field label={t('inventory.remainingMg')} hint={t('common.optional')}>
            {(id) => (
              <Input
                id={id}
                inputMode="decimal"
                value={remaining}
                onChange={(e) => setRemaining(e.target.value)}
                suffix="mg"
              />
            )}
          </Field>
        </div>

        <Field label={t('inventory.concentration')} hint={t('common.optional')}>
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value)}
              suffix="mg/mL"
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('inventory.openedAt')}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('inventory.expiresAt')}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label={t('inventory.lot')} hint={t('common.optional')}>
          {(id) => <Input id={id} value={lot} onChange={(e) => setLot(e.target.value)} />}
        </Field>

        <Field label={t('inventory.storage')} hint={t('common.optional')}>
          {(id) => (
            <Textarea
              id={id}
              rows={2}
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
            />
          )}
        </Field>
      </div>
    </Sheet>
  )
}
