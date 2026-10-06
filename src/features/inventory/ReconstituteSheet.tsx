import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Vial } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import type { InventoryRow } from '@/data/database.types'
import { useUpdateInventory } from '@/data/hooks'
import { toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { effectiveExpiry } from './alerts'
import { DateRow } from './DateRow'
import { contentMgOf, reconstitutionPatch } from './reconstitute'
import { ReconstitutionResult } from './ReconstitutionResult'
import { fmtMg, namesAboveLabel } from './vialFormat'
import { isLyophilised, vialContents, vialLook, waterOf } from './vials'
import { useWaterEntry } from './useWaterEntry'
import { WaterField } from './WaterField'

interface Props {
  /** The vial to reconstitute; nothing is shown without one. */
  vial: InventoryRow | null | undefined
  open: boolean
  onClose: () => void
  /** Today, for tests; the real clock otherwise. */
  now?: Date
}

/**
 * Reconstitute a vial in one step: the water (in syringe units or mL), the day, and a
 * live read of the concentration and of the units your current doses will need. Saves
 * only the water, the concentration and the day; label, content and lot stay as they are.
 * Mounted only while open, so it always starts from the vial it is opened for.
 */
export function ReconstituteSheet({ vial, open, onClose, now }: Props) {
  return open && vial ? <ReconstituteForm vial={vial} onClose={onClose} now={now} /> : null
}

function ReconstituteForm({
  vial,
  onClose,
  now,
}: {
  vial: InventoryRow
  onClose: () => void
  now: Date | undefined
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const update = useUpdateInventory(patientId)
  const [today] = useState(() => now ?? new Date())
  const [date, setDate] = useState(vial.opened_at ?? toDateInputValue(today))
  const entry = useWaterEntry(vial, waterOf(vial), today)
  const openedAt = date || toDateInputValue(today)

  // Correcting a vial already reconstituted (wrong water) is the same sheet.
  const correcting = !isLyophilised(vial)
  const names = vialContents(vial)
    .map((c) => compoundById(c.compoundId)?.names.generic ?? c.compoundId)
    .join(' + ')
  const discard = entry.preview
    ? effectiveExpiry({
        ...vial,
        opened_at: openedAt,
        diluent_ml: entry.waterMl,
        concentration_mg_per_ml: entry.preview.concentration,
      })
    : null

  async function save() {
    const patch = reconstitutionPatch(vial, entry.waterMl, openedAt)
    if (!patch) return
    try {
      await update.mutateAsync({ id: vial.id, patch })
      toast(t('reconstitute.saved'), 'success')
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
      title={correcting ? t('reconstitute.fix') : t('reconstitute.title')}
      footer={
        <Button block size="lg" loading={update.isPending} disabled={!entry.valid} onClick={save}>
          {t('reconstitute.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 py-1">
        <div className="mb-2 flex items-start gap-3 border-b border-line pb-4">
          <Vial {...vialLook(vial)} size={48} />
          <div className="min-w-0 flex-1 pt-0.5">
            {namesAboveLabel(names, vial.label) && (
              <div className="spec mb-0.5 leading-snug">{names}</div>
            )}
            <div className="text-[15px] font-semibold leading-snug">{vial.label}</div>
            <div className="readout mt-0.5 text-[12.5px] text-muted">
              {fmtMg(contentMgOf(vial), locale)} ·{' '}
              {correcting ? t('inventory.statusInUse') : t('inventory.lyophilised')}
            </div>
          </div>
        </div>

        <WaterField
          value={entry.water}
          onChange={entry.setWater}
          contentMg={contentMgOf(vial)}
          issues={entry.issues}
        />

        <DateRow
          label={t('reconstitute.date')}
          value={date}
          max={toDateInputValue(today)}
          onChange={setDate}
        />

        <ReconstitutionResult preview={entry.preview} waterMl={entry.waterMl} discard={discard} />
      </div>
    </Sheet>
  )
}
