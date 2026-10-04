import { Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { useDeleteDoses, useInventory } from '@/data/hooks'
import { fmtDateTime, fmtDose, fmtDoseList } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { vialRefunds, type Administration } from './administrations'
import { unitOf } from './doseLines'

export interface DeleteDoseSheetProps {
  open: boolean
  onClose: () => void
  administration: Administration | null
}

/**
 * Deleting a dose is not undoable, so it asks first, in the app's own sheet: what goes
 * (substances, dose, date) and what the vial gets back. Mounted only while open.
 */
export function DeleteDoseSheet({ open, onClose, administration }: DeleteDoseSheetProps) {
  return open && administration ? (
    <DeleteDoseForm administration={administration} onClose={onClose} />
  ) : null
}

function DeleteDoseForm({
  administration,
  onClose,
}: {
  administration: Administration
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const inventory = useInventory(patientId, true)
  const del = useDeleteDoses(patientId)

  const { rows } = administration
  const refunds = useMemo(
    () => vialRefunds(rows, new Map((inventory.data ?? []).map((v) => [v.id, v]))),
    [rows, inventory.data],
  )

  async function remove() {
    try {
      await del.mutateAsync(rows.map((r) => r.id))
      toast(t('editDose.deleted'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('editDose.deleteTitle')}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="lg"
            loading={del.isPending}
            leading={<Trash2 className="size-5" />}
            onClick={remove}
          >
            {t('editDose.deleteConfirm')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 py-1">
        <div className="rounded-control border border-danger/30 bg-danger-soft px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex shrink-0 items-center gap-1" aria-hidden>
              {rows.map((r) => (
                <SubstanceDot key={r.id} color={compoundColor(r.compound_id)} />
              ))}
            </span>
            <span className="min-w-0 text-[15px] font-semibold leading-snug">
              {rows.map((r) => compoundName(r.compound_id)).join(' + ')}
            </span>
          </div>
          <div className="readout mt-1.5 text-[14px] text-ink-2">
            {fmtDoseList(
              rows.map((r) => ({ valueMg: Number(r.dose_mg), unit: unitOf(r.compound_id) })),
              locale,
            )}
          </div>
          <div className="mt-0.5 text-[13px] text-muted">
            {fmtDateTime(administration.at, locale)}
          </div>
        </div>
        <p className="text-[13.5px] leading-snug text-ink-2">{t('editDose.deleteBody')}</p>
        {refunds.map(({ vial, mg }) => (
          <p key={vial.id} className="text-[13.5px] leading-snug text-ink-2">
            {t('editDose.deleteRefund', {
              vial: vial.label,
              amount: fmtDose(mg, unitOf(vial.compound_id), locale),
            })}
          </p>
        ))}
      </div>
    </Sheet>
  )
}
