import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import type { InventoryForm, InventoryRow, Json } from '@/data/database.types'
import { useSaveInventory } from '@/data/hooks'
import { parseBlend } from '@/data/mappers'
import { SubstancePicker } from '@/features/protocols/SubstancePicker'
import { fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { effectiveExpiry } from './alerts'
import type { BlendPreset } from './blendPresets'
import { BlendEditor, ContentRow, type BlendRow } from './BlendEditor'
import { ChoicePills } from './ChoicePills'
import { DateRow } from './DateRow'
import { contentMgOf, reconstitutionPatch } from './reconstitute'
import { ReconstitutionFields } from './ReconstitutionFields'
import { useWaterEntry } from './useWaterEntry'
import { isLyophilised, waterOf, type VialFields } from './vials'
import { VialLabelInput } from './VialLabelInput'
import { PresetChips, PresetNote } from './VialPresets'

const FORMS: InventoryForm[] = ['vial', 'pen', 'cartridge', 'tablet']
const num = (s: string) => Number(s.replace(',', '.'))
const nameOf = (id: string) => compoundById(id)?.names.generic ?? id

interface Props {
  open: boolean
  onClose: () => void
  editing: InventoryRow | null
  defaultCompoundId?: string
  /** Start from one of the common vials instead of an empty form. */
  preset?: BlendPreset
}

/** What a preset fills in. A single-substance preset leaves the label to follow the amount. */
function presetFields(p: BlendPreset | undefined) {
  const [first, ...rest] = p?.parts ?? []
  return {
    compoundId: first?.compoundId ?? '',
    total: first ? String(first.mg) : '',
    blend: rest.map((r) => ({ compoundId: r.compoundId, mg: String(r.mg) })),
    label: p && !p.sizes ? p.name : '',
  }
}

/** Mounted only while open; initial values come from the row being edited. */
export function InventorySheet({ open, onClose, editing, defaultCompoundId, preset }: Props) {
  return open ? (
    <InventoryFormSheet
      onClose={onClose}
      editing={editing}
      defaultCompoundId={defaultCompoundId}
      preset={preset}
    />
  ) : null
}

function InventoryFormSheet({ onClose, editing, defaultCompoundId, preset }: Omit<Props, 'open'>) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const save = useSaveInventory(patientId)
  const [now] = useState(() => new Date())
  const today = toDateInputValue(now)
  const [start] = useState(() => presetFields(preset))

  const [compoundId, setCompoundId] = useState(
    editing?.compound_id ?? (start.compoundId || defaultCompoundId) ?? '',
  )
  const [picker, setPicker] = useState<'primary' | 'blend' | null>(null)
  const [activePreset, setActivePreset] = useState<BlendPreset | null>(preset ?? null)
  const [blend, setBlend] = useState<BlendRow[]>(() =>
    editing
      ? parseBlend(editing.components).map((c) => ({ compoundId: c.compoundId, mg: String(c.mg) }))
      : start.blend,
  )
  const [form, setForm] = useState<InventoryForm>(editing?.form ?? 'vial')
  const [label, setLabel] = useState(editing?.label ?? start.label)
  const [total, setTotal] = useState(editing ? String(editing.total_mg) : start.total)
  const [remaining, setRemaining] = useState(editing ? String(editing.remaining_mg) : '')
  // A new vial is powder: reconstituting is a later, one-tap step. Editing keeps its state.
  const [reconstituted, setReconstituted] = useState(Boolean(editing && !isLyophilised(editing)))
  const [openedAt, setOpenedAt] = useState(editing?.opened_at ?? '')
  const [expiresAt, setExpiresAt] = useState(editing?.expires_at ?? '')
  const [lot, setLot] = useState(editing?.lot ?? '')
  const [storage, setStorage] = useState(editing?.storage_notes ?? '')

  const compound = compoundId ? compoundById(compoundId) : undefined
  const blendParts = blend.filter((b) => num(b.mg) > 0)
  const contentTotal = num(total) + blendParts.reduce((s, b) => s + num(b.mg), 0)
  const autoLabel = compoundId
    ? `${[compoundId, ...blendParts.map((b) => b.compoundId)].map(nameOf).join(' + ')} ${fmtNumber(contentTotal, locale, 2)} mg`
    : ''

  // Water only makes sense for a vial or cartridge; pens and tablets have none.
  const reconstitutable = form === 'vial' || form === 'cartridge'
  const asReconstituted = reconstitutable && reconstituted
  const reconstitutedOn = openedAt || today
  const draft: VialFields = {
    id: editing?.id ?? 'draft',
    compound_id: compoundId,
    total_mg: num(total),
    components: blendParts.map((b) => ({ compoundId: b.compoundId, mg: num(b.mg) })) as Json,
    concentration_mg_per_ml: null,
    diluent_ml: null,
  }
  const entry = useWaterEntry(draft, editing ? waterOf(editing) : null, now)
  const discard =
    asReconstituted && entry.preview
      ? effectiveExpiry({
          ...draft,
          expires_at: expiresAt || null,
          opened_at: reconstitutedOn,
          diluent_ml: entry.waterMl,
          concentration_mg_per_ml: entry.preview.concentration,
        })
      : null
  const showRemaining = Boolean(editing) || !reconstitutable || reconstituted

  function applyPreset(p: BlendPreset) {
    const f = presetFields(p)
    setCompoundId(f.compoundId)
    setTotal(f.total)
    setBlend(f.blend)
    setLabel(f.label)
    setActivePreset(p)
    setPicker(null)
  }

  async function submit() {
    const tot = num(total)
    if (!compoundId) return setPicker('primary')
    if (!(tot > 0)) return toast(t('errors.positive'), 'warn')
    const patch = asReconstituted
      ? reconstitutionPatch({ total_mg: tot }, entry.waterMl, reconstitutedOn)
      : null
    if (asReconstituted && !patch) return toast(t('inventory.needsWater'), 'warn')
    const rem = showRemaining && remaining.trim() !== '' ? num(remaining) : tot
    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        patient_id: patientId,
        compound_id: compoundId,
        form,
        label: label.trim() || autoLabel,
        components: blendParts.map((b) => ({ compoundId: b.compoundId, mg: num(b.mg) })) as Json,
        total_mg: tot,
        remaining_mg: Math.max(0, Math.min(tot, rem)),
        diluent_ml: patch?.diluent_ml ?? null,
        concentration_mg_per_ml: patch?.concentration_mg_per_ml ?? null,
        // Powder has no dates; pens and tablets keep the day they were opened.
        opened_at: reconstitutable ? (patch?.opened_at ?? null) : openedAt || null,
        expires_at: expiresAt || null,
        lot: lot.trim() || null,
        storage_notes: storage.trim() || null,
      })
      toast(t('common.saved'), 'success')
      onClose()
    } catch (e) {
      // Blend vials need migration 4 (inventory.components).
      const missing = blendParts.length > 0 && /components/i.test((e as Error).message ?? '')
      toast(missing ? t('inventory.needsMigration4') : t('common.error'), 'error')
    }
  }

  const primaryName = compound?.names.generic ?? ''

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        tall
        title={editing ? t('inventory.edit') : t('inventory.add')}
        description={editing?.label}
        footer={
          <Button block size="lg" loading={save.isPending} onClick={submit}>
            {editing ? t('inventory.saveChanges') : t(`inventory.addForm.${form}`)}
          </Button>
        }
      >
        <div className="flex flex-col gap-7 py-1">
          {!editing && <PresetChips activeId={activePreset?.id} onPick={applyPreset} />}

          <Section label={t('inventory.contentSection')}>
            <ContentRow
              compoundId={compoundId}
              placeholder={t('protocols.pickSubstance')}
              onPick={() => setPicker('primary')}
              mg={total}
              onMg={setTotal}
              mgLabel={
                blend.length
                  ? t('inventory.totalOf', { name: primaryName })
                  : t('inventory.totalMg')
              }
              gutter={blend.length > 0}
            />
            {compound && (
              <BlendEditor parts={blend} onChange={setBlend} onAdd={() => setPicker('blend')} />
            )}
            {activePreset && !editing && (
              <PresetNote
                preset={activePreset}
                totalMg={num(total)}
                showSizes={blend.length === 0}
                onSize={(mg) => setTotal(String(mg))}
              />
            )}
          </Section>

          <Section label={t('inventory.form')}>
            <ChoicePills<InventoryForm>
              label={t('inventory.form')}
              value={form}
              onChange={setForm}
              options={FORMS.map((f) => ({ value: f, label: t(`inventory.forms.${f}`) }))}
            />
          </Section>

          {(reconstitutable || showRemaining) && (
            <div className="flex flex-col gap-5">
              {reconstitutable && (
                <ReconstitutionFields
                  on={reconstituted}
                  onToggle={setReconstituted}
                  entry={entry}
                  contentMg={contentMgOf(draft)}
                  date={reconstitutedOn}
                  max={today}
                  onDate={setOpenedAt}
                  discard={discard}
                />
              )}
              {showRemaining && (
                <Field label={t('inventory.remainingMg')} hint={t('inventory.remainingHint')}>
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      inputMode="decimal"
                      value={remaining}
                      onChange={(e) => setRemaining(e.target.value)}
                      suffix="mg"
                      className="readout"
                    />
                  )}
                </Field>
              )}
            </div>
          )}

          <Section label={t('inventory.optionalSection')}>
            <div className="flex flex-col gap-4 pt-1">
              {/* The name it will get is written out under the field: a placeholder would be cut off. */}
              <Field
                label={t('inventory.label')}
                hint={
                  autoLabel && !label.trim()
                    ? t('inventory.labelAuto', { label: autoLabel })
                    : undefined
                }
              >
                {(id, describedBy) => (
                  <VialLabelInput
                    id={id}
                    describedBy={describedBy}
                    value={label}
                    onChange={setLabel}
                    placeholder={t('inventory.labelPlaceholder')}
                  />
                )}
              </Field>

              <div className="flex flex-col gap-2">
                {!reconstitutable && (
                  <DateRow
                    label={t('inventory.openedAt')}
                    value={openedAt}
                    onChange={setOpenedAt}
                  />
                )}
                <DateRow
                  label={t('inventory.labelExpiry')}
                  value={expiresAt}
                  onChange={setExpiresAt}
                />
              </div>

              <Field label={t('inventory.lot')}>
                {(id) => <Input id={id} value={lot} onChange={(e) => setLot(e.target.value)} />}
              </Field>
              <Field label={t('inventory.storage')}>
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
          </Section>
        </div>
      </Sheet>
      <SubstancePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        exclude={picker === 'blend' ? [compoundId, ...blend.map((x) => x.compoundId)] : []}
        onPick={(cid) => {
          if (picker === 'blend') setBlend((xs) => [...xs, { compoundId: cid, mg: '' }])
          else setCompoundId(cid)
          setPicker(null)
        }}
      />
    </>
  )
}

/** A group of the form: a quiet label over its fields, set apart by space rather than a box. */
function Section({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className="spec mb-1">{label}</h3>
      {children}
    </section>
  )
}
