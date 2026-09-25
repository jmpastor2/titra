import { Layers, Plus, X } from 'lucide-react'
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
import { mgToUnits, vialConcentration } from '@/domain/dosing/reconstitution'
import { SubstancePicker } from '@/features/protocols/SubstancePicker'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { BLEND_PRESETS, type BlendPreset } from './blendPresets'

const FORMS: InventoryForm[] = ['vial', 'pen', 'cartridge', 'tablet']
const num = (s: string) => Number(s.replace(',', '.'))

interface Props {
  open: boolean
  onClose: () => void
  editing: InventoryRow | null
  defaultCompoundId?: string
}

/** Mounted only while open; initial values come from the row being edited. */
export function InventorySheet({ open, onClose, editing, defaultCompoundId }: Props) {
  return open ? (
    <InventoryFormSheet onClose={onClose} editing={editing} defaultCompoundId={defaultCompoundId} />
  ) : null
}

function InventoryFormSheet({ onClose, editing, defaultCompoundId }: Omit<Props, 'open'>) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const save = useSaveInventory(patientId)

  const [compoundId, setCompoundId] = useState(editing?.compound_id ?? defaultCompoundId ?? '')
  const [picker, setPicker] = useState<'primary' | 'blend' | null>(
    !editing && !defaultCompoundId ? 'primary' : null,
  )
  const [blend, setBlend] = useState(() =>
    parseBlend(editing?.components).map((c) => ({ ...c, mg: String(c.mg) })),
  )
  const [form, setForm] = useState<InventoryForm>(editing?.form ?? 'vial')
  const [label, setLabel] = useState(editing?.label ?? '')
  const [total, setTotal] = useState(editing ? String(editing.total_mg) : '')
  const [remaining, setRemaining] = useState(editing ? String(editing.remaining_mg) : '')
  const [diluent, setDiluent] = useState(editing?.diluent_ml ? String(editing.diluent_ml) : '')
  const [openedAt, setOpenedAt] = useState(editing?.opened_at ?? '')
  const [expiresAt, setExpiresAt] = useState(editing?.expires_at ?? '')
  const [lot, setLot] = useState(editing?.lot ?? '')
  const [storage, setStorage] = useState(editing?.storage_notes ?? '')

  const compound = compoundId ? compoundById(compoundId) : undefined
  const unit = compound?.defaultUnit ?? 'mg'
  const conc = vialConcentration(num(total), num(diluent))
  const blendParts = blend.filter((b) => num(b.mg) > 0)

  function applyPreset(p: BlendPreset) {
    const [first, ...rest] = p.parts
    if (!first) return
    setCompoundId(first.compoundId)
    setTotal(String(first.mg))
    setBlend(rest.map((r) => ({ compoundId: r.compoundId, mg: String(r.mg) })))
    setLabel(p.name)
    setPicker(null)
  }
  // A typical 100 mcg / 0.25 mg draw makes the concentration tangible.
  const sampleMg = unit === 'mcg' ? 0.1 : 0.25

  async function submit() {
    const tot = num(total)
    const rem = remaining.trim() === '' ? tot : num(remaining)
    if (!compoundId) return setPicker('primary')
    if (!(tot > 0)) return toast(t('errors.positive'), 'warn')
    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        patient_id: patientId,
        compound_id: compoundId,
        form,
        label:
          label.trim() ||
          `${[compoundId, ...blendParts.map((b) => b.compoundId)]
            .map((id) => compoundById(id)?.names.generic ?? id)
            .join(
              ' + ',
            )} ${fmtNumber(tot + blendParts.reduce((s, b) => s + num(b.mg), 0), locale, 2)} mg`,
        components: blendParts.map((b) => ({ compoundId: b.compoundId, mg: num(b.mg) })) as Json,
        total_mg: tot,
        remaining_mg: Math.max(0, Math.min(tot, rem)),
        diluent_ml: num(diluent) > 0 ? num(diluent) : null,
        concentration_mg_per_ml: conc,
        opened_at: openedAt || null,
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
          {!editing && (
            <div>
              <div className="spec mb-2 flex items-center gap-1.5">
                <Layers className="size-3.5" /> {t('inventory.blendPresets')}
              </div>
              <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
                {BLEND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-panel-2 px-3 py-2 text-[12.5px] font-semibold"
                  >
                    {p.parts.map((x) => (
                      <SubstanceDot key={x.compoundId} color={compoundColor(x.compoundId)} />
                    ))}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPicker('primary')}
            className="flex items-center gap-3 rounded-control border border-line-strong bg-panel-2 px-3.5 py-3 text-left"
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
            <div className="rounded-control border border-line bg-panel-2 p-3">
              <div className="spec mb-1">{t('inventory.blendTitle')}</div>
              <p className="mb-2 text-[12px] text-muted">{t('inventory.blendHint')}</p>
              {blend.map((b, i) => (
                <div key={b.compoundId} className="mb-2 flex items-center gap-2">
                  <SubstanceDot color={compoundColor(b.compoundId)} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                    {compoundById(b.compoundId)?.names.generic ?? b.compoundId}
                  </span>
                  <div className="w-[110px]">
                    <Input
                      inputMode="decimal"
                      aria-label={t('inventory.totalMg')}
                      value={b.mg}
                      onChange={(e) =>
                        setBlend((xs) =>
                          xs.map((x, j) => (j === i ? { ...x, mg: e.target.value } : x)),
                        )
                      }
                      suffix="mg"
                      className="readout h-10 bg-panel"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={() => setBlend((xs) => xs.filter((_, j) => j !== i))}
                    className="grid size-8 place-items-center rounded-full text-muted hover:text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPicker('blend')}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-signal"
              >
                <Plus className="size-4" /> {t('inventory.blendAdd')}
              </button>
            </div>
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

          {(form === 'vial' || form === 'cartridge') && (
            <div className="rounded-control border border-line bg-panel-2 p-3">
              <Field label={t('inventory.diluent')} hint={t('inventory.diluentHint')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={diluent}
                    onChange={(e) => setDiluent(e.target.value)}
                    suffix="mL"
                    className="bg-panel"
                  />
                )}
              </Field>
              {conc && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="spec">{t('calculator.concentration')}</div>
                    <div className="readout mt-1 text-[18px] font-semibold text-signal">
                      {fmtNumber(conc, locale, 3)}{' '}
                      <span className="text-[11px] text-muted">mg/mL</span>
                    </div>
                  </div>
                  <div>
                    <div className="spec">
                      {unit === 'mcg' ? '100 mcg' : `${fmtNumber(sampleMg, locale, 2)} mg`}
                    </div>
                    <div className="readout mt-1 text-[18px] font-semibold">
                      {fmtNumber(mgToUnits(sampleMg, conc), locale, 1)}{' '}
                      <span className="text-[11px] text-muted">U</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
