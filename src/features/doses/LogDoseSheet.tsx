import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Badge, Segmented } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { COMPOUNDS, compoundById } from '@/content/compounds'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { useAddDose, useDoses, useInventory, useProtocols } from '@/data/hooks'
import { toProtocolLike } from '@/data/mappers'
import { currentStep } from '@/domain/dosing/schedule'
import { INJECTION_SITES, suggestNextSite } from '@/domain/sites/injectionSites'
import type { DoseUnit } from '@/domain/types'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/format'

export interface LogDoseSheetProps {
  open: boolean
  onClose: () => void
  /** Preselect a compound/protocol (from the dashboard). */
  defaultCompoundId?: string
  defaultProtocolId?: string | null
  defaultDoseMg?: number
}

/** Values are entered in the compound's unit; mcg is normalised to mg for storage. */
function toMg(value: number, unit: DoseUnit): number {
  return unit === 'mcg' ? value / 1000 : value
}
function fromMg(mg: number, unit: DoseUnit): number {
  return unit === 'mcg' ? mg * 1000 : mg
}

/** Dose of the step active today, falling back to the last step once a finite protocol ends. */
function currentStepDoseMg(p: ProtocolRow, now: Date): number | undefined {
  const pl = toProtocolLike(p)
  return currentStep(pl, now)?.step.doseMg ?? pl.steps[pl.steps.length - 1]?.doseMg
}

function siteHistory(doses: readonly DoseRow[] | undefined) {
  return (doses ?? []).flatMap((d) =>
    d.site_id ? [{ siteId: d.site_id, at: new Date(d.administered_at) }] : [],
  )
}

/** Mounted only while open, so each opening starts from fresh, data-derived defaults. */
export function LogDoseSheet(props: LogDoseSheetProps) {
  return props.open ? <LogDoseForm {...props} /> : null
}

function LogDoseForm({
  onClose,
  defaultCompoundId,
  defaultProtocolId,
  defaultDoseMg,
}: LogDoseSheetProps) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const inventory = useInventory(patientId)
  const addDose = useAddDose(patientId)

  const activeProtocols = useMemo(
    () => (protocols.data ?? []).filter((p) => p.status === 'active'),
    [protocols.data],
  )

  // Initial selection, computed once from whatever is cached when the sheet opens.
  const [initial] = useState(() => {
    const now = new Date()
    const protocol =
      activeProtocols.find((p) => p.id === defaultProtocolId) ??
      activeProtocols.find((p) => p.compound_id === defaultCompoundId) ??
      activeProtocols[0]
    const compoundId =
      defaultCompoundId ?? protocol?.compound_id ?? COMPOUNDS[0]?.id ?? 'semaglutide'
    const matching = protocol && protocol.compound_id === compoundId ? protocol : undefined
    const unit = compoundById(compoundId)?.defaultUnit ?? 'mg'
    const mg = defaultDoseMg ?? (matching ? currentStepDoseMg(matching, now) : undefined)
    return {
      protocolId: matching?.id ?? '',
      compoundId,
      amount: mg !== undefined ? String(fromMg(mg, unit)) : '',
      siteId: suggestNextSite(siteHistory(doses.data))?.siteId ?? '',
    }
  })

  const [protocolId, setProtocolId] = useState(initial.protocolId)
  const [compoundId, setCompoundId] = useState(initial.compoundId)
  const [amount, setAmount] = useState(initial.amount)
  const [whenMode, setWhenMode] = useState<'now' | 'custom'>('now')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [siteId, setSiteId] = useState(initial.siteId)
  const [inventoryId, setInventoryId] = useState('')
  const [notes, setNotes] = useState('')

  const compound = compoundById(compoundId)
  const unit: DoseUnit = compound?.defaultUnit ?? 'mg'
  const suggestion = useMemo(() => suggestNextSite(siteHistory(doses.data)), [doses.data])
  const compoundInventory = (inventory.data ?? []).filter(
    (i) => i.compound_id === compoundId && Number(i.remaining_mg) > 0,
  )

  function selectProtocol(pid: string) {
    setProtocolId(pid)
    const p = activeProtocols.find((x) => x.id === pid)
    if (!p) return
    setCompoundId(p.compound_id)
    setInventoryId('')
    const mg = currentStepDoseMg(p, new Date())
    const u = compoundById(p.compound_id)?.defaultUnit ?? 'mg'
    if (mg !== undefined) setAmount(String(fromMg(mg, u)))
  }

  async function submit() {
    const val = Number(amount.replace(',', '.'))
    if (!(val > 0)) {
      toast(t('errors.positive'), 'warn')
      return
    }
    const at = whenMode === 'now' ? new Date() : fromDateTimeInputs(date, time)
    try {
      await addDose.mutateAsync({
        patient_id: patientId,
        protocol_id: protocolId || null,
        compound_id: compoundId,
        dose_mg: toMg(val, unit),
        administered_at: at.toISOString(),
        site_id: siteId || null,
        inventory_id: inventoryId || null,
        notes: notes.trim() || null,
      })
      toast(t('doses.logged'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('doses.logTitle')}
      footer={
        <Button block size="lg" loading={addDose.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <Field label={t('doses.protocol')}>
          {(id) => (
            <Select id={id} value={protocolId} onChange={(e) => selectProtocol(e.target.value)}>
              <option value="">{t('doses.noProtocolOption')}</option>
              {activeProtocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('doses.compound')}>
          {(id) => (
            <Select
              id={id}
              value={compoundId}
              disabled={Boolean(protocolId)}
              onChange={(e) => {
                setCompoundId(e.target.value)
                setInventoryId('')
              }}
            >
              {COMPOUNDS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.names.generic}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('doses.dose')}>
          {(id) => (
            <Input
              id={id}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              suffix={t(`units.${unit}`)}
              className="tabular text-[18px] font-semibold"
            />
          )}
        </Field>

        <Field label={t('doses.when')}>
          {() => (
            <div className="flex flex-col gap-2">
              <Segmented<'now' | 'custom'>
                value={whenMode}
                onChange={setWhenMode}
                size="sm"
                options={[
                  { value: 'now', label: t('doses.now') },
                  { value: 'custom', label: t('common.date') },
                ]}
              />
              {whenMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              )}
            </div>
          )}
        </Field>

        {compound?.routes.some((r) => r === 'sc' || r === 'im') && (
          <Field
            label={t('doses.site')}
            hint={suggestion?.tooRecent ? t('doses.siteTooRecent') : undefined}
          >
            {() => (
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {INJECTION_SITES.map((s) => {
                  const active = siteId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSiteId(active ? '' : s.id)}
                      className={
                        active
                          ? 'flex h-11 items-center justify-between rounded-control border border-brand bg-brand-soft px-3 text-[13.5px] font-semibold text-brand-strong'
                          : 'flex h-11 items-center justify-between rounded-control border border-line bg-surface px-3 text-[13.5px] text-ink-2'
                      }
                    >
                      {t(`sites.labels.${s.labelKey}`)}
                      {suggestion?.siteId === s.id && (
                        <Badge tone="brand">{t('doses.suggestedSite')}</Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </Field>
        )}

        {compoundInventory.length > 0 && (
          <Field label={t('doses.inventory')}>
            {(id) => (
              <Select id={id} value={inventoryId} onChange={(e) => setInventoryId(e.target.value)}>
                <option value="">{t('doses.noInventory')}</option>
                {compoundInventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} · {i.remaining_mg} mg
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <Field label={`${t('common.notes')} (${t('common.optional')})`}>
          {(id) => (
            <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          )}
        </Field>
      </div>
    </Sheet>
  )
}
