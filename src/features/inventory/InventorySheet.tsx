import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryForm, InventoryRow, Json } from '@/data/database.types'
import { useSaveInventory } from '@/data/hooks'
import { parseBlend } from '@/data/mappers'
import { SubstancePicker } from '@/features/protocols/SubstancePicker'
import { fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { effectiveExpiry } from './alerts'
import type { BlendPreset } from './blendPresets'
import { BlendEditor, type BlendRow } from './BlendEditor'
import { contentMgOf, reconstitutionPatch } from './reconstitute'
import { ReconstitutionFields } from './ReconstitutionFields'
import { useWaterEntry } from './useWaterEntry'
import { isLyophilised, waterOf, type VialFields } from './vials'
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

  return (
    <>
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
          {!editing && <PresetChips activeId={activePreset?.id} onPick={applyPreset} />}

          <button
            type="button"
            onClick={() => setPicker('primary')}
            className="flex min-h-12 items-center gap-3 rounded-control border border-line-strong bg-panel-2 px-3.5 py-3 text-left"
          >
            {compound ? (
              <>
                <SubstanceDot color={compoundColor(compound.id)} size={10} />
                <span className="flex-1 text-[15px] font-semibold">{compound.names.generic}</span>
                <span className="spec">{t('common.edit')}</span>
              </>
            ) : (
              <span className="text-[15px] font-semibold text-signal">
                {t('protocols.pickSubstance')}
              </span>
            )}
          </button>

          {compound && (
            <BlendEditor parts={blend} onChange={setBlend} onAdd={() => setPicker('blend')} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('inventory.form')}>
              {(id) => (
                <Select
                  id={id}
                  value={form}
                  onChange={(e) => setForm(e.target.value as InventoryForm)}
                >
                  {FORMS.map((f) => (
                    <option key={f} value={f}>
                      {t(`inventory.forms.${f}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label={
                blend.length
                  ? t('inventory.totalOf', { name: compound?.names.generic ?? '' })
                  : t('inventory.totalMg')
              }
            >
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
          </div>

          {activePreset && !editing && (
            <PresetNote
              preset={activePreset}
              totalMg={num(total)}
              showSizes={blend.length === 0}
              onSize={(mg) => setTotal(String(mg))}
            />
          )}

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
          )}

          <Field label={t('inventory.label')}>
            {(id) => (
              <Input
                id={id}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={autoLabel || t('inventory.labelPlaceholder')}
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {!reconstitutable && (
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
            )}
            <Field
              label={`${t('inventory.labelExpiry')} · ${t('common.optional')}`}
              className={reconstitutable ? 'col-span-2' : undefined}
            >
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

          <Field label={`${t('inventory.lot')} · ${t('common.optional')}`}>
            {(id) => <Input id={id} value={lot} onChange={(e) => setLot(e.target.value)} />}
          </Field>
          <Field label={`${t('inventory.storage')} · ${t('common.optional')}`}>
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
