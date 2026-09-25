import { Info, Plus, Syringe, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Badge, Segmented, SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { useAddDose, useDoses, useInventory, useProtocols } from '@/data/hooks'
import { toProtocolLike } from '@/data/mappers'
import { planDraw } from '@/domain/dosing/draw'
import { mgToUnits, unitsToMg } from '@/domain/dosing/reconstitution'
import { componentsAt, currentStep } from '@/domain/dosing/schedule'
import { INJECTION_SITES, suggestNextSite } from '@/domain/sites/injectionSites'
import type { DoseUnit } from '@/domain/types'
import {
  activeVial,
  concentrationFor,
  drawPartFor,
  isBlend,
  vialHas,
} from '@/features/inventory/vials'
import { SubstancePicker } from '@/features/protocols/SubstancePicker'
import {
  fmtDose,
  fmtNumber,
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { DrawGuide } from './DrawGuide'

export interface LogDoseSheetProps {
  open: boolean
  onClose: () => void
  /** Log an administration of this protocol (all its stack compounds). */
  protocolId?: string | null
  /** Free dose of a single compound, outside any protocol. */
  compoundId?: string
}

type EntryMode = 'dose' | 'units'

interface Line {
  key: number
  compoundId: string
  amount: string
  mode: EntryMode
  inventoryId: string
  /** Other compounds drawn in the same units from the same blend vial. */
  partners: string[]
}

/** mg ↔ the compound's display unit (mcg is shown as mcg; mg, IU and U as stored). */
function toMg(value: number, unit: DoseUnit): number {
  return unit === 'mcg' ? value / 1000 : value
}
function fromMg(mg: number, unit: DoseUnit): number {
  return unit === 'mcg' ? mg * 1000 : mg
}
function unitOf(compoundId: string): DoseUnit {
  return compoundById(compoundId)?.defaultUnit ?? 'mg'
}
const parse = (s: string) => Number(s.replace(',', '.'))
const plain = (n: number) => String(Math.round(n * 1000) / 1000)

function siteHistory(doses: readonly DoseRow[] | undefined) {
  return (doses ?? []).flatMap((d) =>
    d.site_id ? [{ siteId: d.site_id, at: new Date(d.administered_at) }] : [],
  )
}

let lineSeq = 0

function makeLine(
  compoundId: string,
  mg: number | undefined,
  vials: readonly InventoryRow[],
): Line {
  const vial = activeVial(vials, compoundId)
  const conc = vial ? concentrationFor(vial, compoundId) : null
  // Prefer syringe units whenever the vial's concentration is known: it is what the user draws.
  const mode: EntryMode = conc ? 'units' : 'dose'
  let amount = ''
  if (mg !== undefined)
    amount = conc ? plain(mgToUnits(mg, conc)) : plain(fromMg(mg, unitOf(compoundId)))
  return { key: ++lineSeq, compoundId, amount, mode, inventoryId: vial?.id ?? '', partners: [] }
}

/** Compounds of one blend vial become a single line: one draw, several doses. */
function mergeBlends(lines: Line[], vials: readonly InventoryRow[]): Line[] {
  const out: Line[] = []
  for (const l of lines) {
    const host = out.find((o) => {
      const v = vials.find((x) => x.id === o.inventoryId)
      return v && o.inventoryId === l.inventoryId && isBlend(v) && vialHas(v, l.compoundId)
    })
    if (host) host.partners.push(l.compoundId)
    else out.push({ ...l, partners: [...l.partners] })
  }
  return out
}

function linesForProtocol(
  protocol: ProtocolRow | undefined,
  vials: readonly InventoryRow[],
): Line[] {
  if (!protocol) return []
  const pl = toProtocolLike(protocol)
  const step = currentStep(pl, new Date())?.step ?? pl.steps[pl.steps.length - 1]
  const primaryMg = step && !step.pause ? step.doseMg : undefined
  return mergeBlends(
    [
      makeLine(protocol.compound_id, primaryMg, vials),
      ...componentsAt(pl, primaryMg ?? 0).map((c) => makeLine(c.compoundId, c.doseMg, vials)),
    ],
    vials,
  )
}

/**
 * Mounted only while open, and only once protocols, vials and history are loaded, so each
 * opening starts from fresh, data-derived defaults (also when opened from a notification).
 */
export function LogDoseSheet(props: LogDoseSheetProps) {
  return props.open ? <LogDoseLoader {...props} /> : null
}

function LogDoseLoader(props: LogDoseSheetProps) {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const inventory = useInventory(patientId)
  if (protocols.isPending || doses.isPending || inventory.isPending) return null
  return <LogDoseForm {...props} />
}

function LogDoseForm({
  onClose,
  protocolId: initialProtocolId,
  compoundId: initialCompoundId,
}: LogDoseSheetProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const inventory = useInventory(patientId)
  const addDose = useAddDose(patientId)

  const active = useMemo(
    () => (protocols.data ?? []).filter((p) => p.status === 'active'),
    [protocols.data],
  )
  const vials = useMemo(() => inventory.data ?? [], [inventory.data])

  const [protocolId, setProtocolId] = useState(() => initialProtocolId ?? '')
  const [lines, setLines] = useState<Line[]>(() =>
    initialProtocolId
      ? linesForProtocol(
          active.find((p) => p.id === initialProtocolId),
          vials,
        )
      : initialCompoundId
        ? [makeLine(initialCompoundId, undefined, vials)]
        : [],
  )
  const [pickerOpen, setPickerOpen] = useState(!initialProtocolId && !initialCompoundId)
  const [whenMode, setWhenMode] = useState<'now' | 'custom'>('now')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [siteId, setSiteId] = useState(() => suggestNextSite(siteHistory(doses.data))?.siteId ?? '')
  const [notes, setNotes] = useState('')

  const suggestion = useMemo(() => suggestNextSite(siteHistory(doses.data)), [doses.data])
  const injectable = lines.some((l) =>
    compoundById(l.compoundId)?.routes.some((r) => r === 'sc' || r === 'im'),
  )

  function selectProtocol(pid: string) {
    setProtocolId(pid)
    setLines(
      linesForProtocol(
        active.find((p) => p.id === pid),
        vials,
      ),
    )
  }

  function patchLine(key: number, patch: Partial<Line>) {
    setLines((ls) =>
      ls.flatMap((l) => {
        if (l.key !== key) return [l]
        const next = { ...l, ...patch }
        const vial = vials.find((v) => v.id === next.inventoryId)
        // A partner the new vial does not hold goes back to a line of its own.
        const stay = next.partners.filter((c) => vial && vialHas(vial, c))
        const leave = next.partners.filter((c) => !stay.includes(c))
        const mg = lineMg(l)
        return [
          { ...next, partners: stay },
          ...leave.map((c) => makeLine(c, mg ?? undefined, vials)),
        ]
      }),
    )
  }

  /** mg represented by a line, or null when it is not a valid positive amount. */
  function lineMg(l: Line): number | null {
    const v = parse(l.amount)
    if (!(v > 0)) return null
    if (l.mode === 'units') {
      const vial = vials.find((x) => x.id === l.inventoryId)
      const conc = vial ? concentrationFor(vial, l.compoundId) : null
      return conc ? unitsToMg(v, conc) : null
    }
    return toMg(v, unitOf(l.compoundId))
  }

  /** mg of a blend partner drawn with the line: same volume, its own concentration. */
  function partnerMg(l: Line, partner: string): number | null {
    const mg = lineMg(l)
    const vial = vials.find((x) => x.id === l.inventoryId)
    const own = vial ? concentrationFor(vial, l.compoundId) : null
    const theirs = vial ? concentrationFor(vial, partner) : null
    return mg !== null && own && theirs ? mg * (theirs / own) : null
  }

  const drawPlan = injectable
    ? planDraw(
        lines.flatMap((l) => {
          const vial = vials.find((v) => v.id === l.inventoryId)
          return [
            drawPartFor(vials, l.compoundId, lineMg(l) ?? 0, vial),
            ...l.partners.map((c) => drawPartFor(vials, c, partnerMg(l, c) ?? 0, vial)),
          ]
        }),
      )
    : null

  async function submit() {
    if (lines.length === 0) {
      setPickerOpen(true)
      return
    }
    const mgs = lines.map(lineMg)
    if (mgs.some((m) => m === null)) {
      toast(t('errors.positive'), 'warn')
      return
    }
    const at = (whenMode === 'now' ? new Date() : fromDateTimeInputs(date, time)).toISOString()
    try {
      const base = {
        patient_id: patientId,
        protocol_id: protocolId || null,
        administered_at: at,
        site_id: injectable ? siteId || null : null,
        notes: notes.trim() || null,
      }
      await addDose.mutateAsync(
        lines.flatMap((l, i) => {
          const vial = vials.find((v) => v.id === l.inventoryId)
          // Only the vial's own compound draws down its stock; blend partners ride along.
          const owner = l.partners.length && vial ? vial.compound_id : l.compoundId
          return [
            { compoundId: l.compoundId, mg: mgs[i]! },
            ...l.partners.map((c) => ({ compoundId: c, mg: partnerMg(l, c) ?? 0 })),
          ].map((d) => ({
            ...base,
            compound_id: d.compoundId,
            dose_mg: d.mg,
            inventory_id: d.compoundId === owner ? l.inventoryId || null : null,
          }))
        }),
      )
      toast(t('doses.logged'), 'success')
      onClose()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={t('doses.logTitle')}
        footer={
          <Button
            block
            size="lg"
            loading={addDose.isPending}
            leading={<Syringe className="size-5" />}
            onClick={submit}
          >
            {t('doses.confirm')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          {active.length > 0 && (
            <Field label={t('doses.protocol')}>
              {(id) => (
                <Select id={id} value={protocolId} onChange={(e) => selectProtocol(e.target.value)}>
                  <option value="">{t('doses.noProtocolOption')}</option>
                  {active.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          {active.find((p) => p.id === protocolId)?.notes && (
            <p className="-mt-2 flex items-start gap-1.5 rounded-control border border-warn/30 bg-warn-soft px-3 py-2 text-[12.5px] leading-snug text-ink-2">
              <Info className="mt-0.5 size-3.5 shrink-0 text-warn" />
              {active.find((p) => p.id === protocolId)!.notes}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="spec">
                {lines.length > 1 ? t('doses.sameSyringe') : t('doses.substance')}
              </span>
              {!protocolId && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1 text-[12.5px] font-semibold text-signal"
                >
                  <Plus className="size-3.5" /> {t('doses.addToSyringe')}
                </button>
              )}
            </div>
            {lines.map((l) => (
              <DoseLine
                key={l.key}
                line={l}
                vials={vials.filter((v) => vialHas(v, l.compoundId))}
                locale={locale}
                removable={!protocolId}
                onChange={(p) => patchLine(l.key, p)}
                onRemove={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                partnerDoses={l.partners.map((c) => ({ compoundId: c, mg: partnerMg(l, c) }))}
              />
            ))}
            {drawPlan && <DrawGuide plan={drawPlan} />}
          </div>

          <Field label={t('doses.when')}>
            {() => (
              <div className="flex flex-col gap-2">
                <Segmented<'now' | 'custom'>
                  value={whenMode}
                  onChange={setWhenMode}
                  size="sm"
                  options={[
                    { value: 'now', label: t('doses.now') },
                    { value: 'custom', label: t('doses.otherTime') },
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

          {injectable && (
            <Field
              label={t('doses.site')}
              hint={suggestion?.tooRecent ? t('doses.siteTooRecent') : undefined}
            >
              {() => (
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  {INJECTION_SITES.map((s) => {
                    const on = siteId === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSiteId(on ? '' : s.id)}
                        className={
                          on
                            ? 'flex h-11 items-center justify-between gap-1 rounded-control border border-signal/50 bg-signal-soft px-3 text-[13px] font-semibold text-ink'
                            : 'flex h-11 items-center justify-between gap-1 rounded-control border border-line bg-panel-2 px-3 text-[13px] text-ink-2'
                        }
                      >
                        <span className="truncate">{t(`sites.labels.${s.labelKey}`)}</span>
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

          <Field label={`${t('common.notes')} · ${t('common.optional')}`}>
            {(id) => (
              <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            )}
          </Field>
        </div>
      </Sheet>

      <SubstancePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exclude={lines.map((l) => l.compoundId)}
        onPick={(cid) => {
          setLines((ls) => [...ls, makeLine(cid, undefined, vials)])
          setPickerOpen(false)
        }}
      />
    </>
  )
}

function DoseLine({
  line,
  vials,
  locale,
  removable,
  onChange,
  onRemove,
  partnerDoses = [],
}: {
  line: Line
  vials: readonly InventoryRow[]
  locale: 'es' | 'en'
  removable: boolean
  onChange: (p: Partial<Line>) => void
  onRemove: () => void
  /** Blend partners drawn with this line and the mg each one gets. */
  partnerDoses?: { compoundId: string; mg: number | null }[]
}) {
  const { t } = useTranslation()
  const unit = unitOf(line.compoundId)
  const vial = vials.find((v) => v.id === line.inventoryId)
  const concOf = (v: InventoryRow) => concentrationFor(v, line.compoundId)
  const conc = vial ? concOf(vial) : null
  const value = parse(line.amount)
  const canUseUnits = vials.some((v) => concOf(v))

  const lineDoseMg =
    value > 0
      ? line.mode === 'units'
        ? conc
          ? unitsToMg(value, conc)
          : null
        : toMg(value, unit)
      : null

  // Live conversion readout: units → dose, or dose → units when the vial allows it.
  let conversion: string | null = null
  if (value > 0 && conc) {
    conversion =
      line.mode === 'units'
        ? `= ${fmtNumber(fromMg(unitsToMg(value, conc), unit), locale, 1)} ${t(`units.${unit}`)}`
        : `= ${fmtNumber(mgToUnits(toMg(value, unit), conc), locale, 1)} U`
  }

  // Units only mean something against a vial: without one, fall back to the dose itself.
  function changeVial(inventoryId: string) {
    const next = vials.find((v) => v.id === inventoryId)
    const nextConc = next ? concOf(next) : null
    if (line.mode === 'units' && !nextConc) {
      const amount = value > 0 && conc ? plain(fromMg(unitsToMg(value, conc), unit)) : line.amount
      onChange({ inventoryId, mode: 'dose', amount })
    } else if (line.mode === 'units' && nextConc && conc && value > 0) {
      // Same dose from a vial of another strength: keep the dose, recompute the units.
      onChange({ inventoryId, amount: plain(mgToUnits(unitsToMg(value, conc), nextConc)) })
    } else {
      onChange({ inventoryId })
    }
  }

  function switchMode(mode: EntryMode) {
    if (mode === line.mode) return
    // Convert the typed amount so switching never silently changes the dose.
    let amount = line.amount
    let inventoryId = line.inventoryId
    const target = conc ? vial : vials.find((v) => concOf(v))
    const targetConc = target ? concOf(target) : null
    if (mode === 'units' && target) inventoryId = target.id
    if (value > 0 && targetConc) {
      amount =
        mode === 'units'
          ? plain(mgToUnits(toMg(value, unit), targetConc))
          : plain(fromMg(unitsToMg(value, targetConc), unit))
    }
    onChange({ mode, amount, inventoryId })
  }

  return (
    <div className="rounded-control border border-line bg-panel-2 p-3">
      <div className="mb-2 flex items-center gap-2">
        <SubstanceDot color={compoundColor(line.compoundId)} />
        {partnerDoses.map((p) => (
          <SubstanceDot key={p.compoundId} color={compoundColor(p.compoundId)} />
        ))}
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
          {[line.compoundId, ...partnerDoses.map((p) => p.compoundId)]
            .map((id) => compoundById(id)?.names.generic ?? id)
            .join(' + ')}
        </span>
        {partnerDoses.length > 0 && <Badge tone="brand">{t('doses.blend')}</Badge>}
        {removable && (
          <button
            type="button"
            aria-label={t('common.delete')}
            onClick={onRemove}
            className="grid size-7 place-items-center rounded-full text-muted hover:text-danger"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <Input
            inputMode="decimal"
            aria-label={t('doses.dose')}
            value={line.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            suffix={line.mode === 'units' ? 'U' : t(`units.${unit}`)}
            className="readout bg-panel text-[20px] font-semibold"
          />
        </div>
        {canUseUnits && (
          <div className="w-[108px] shrink-0">
            <Segmented<EntryMode>
              value={line.mode}
              onChange={switchMode}
              size="sm"
              className="h-12"
              options={[
                { value: 'units', label: 'U' },
                { value: 'dose', label: t(`units.${unit}`) },
              ]}
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {vials.length > 0 ? (
          <select
            aria-label={t('doses.inventory')}
            value={line.inventoryId}
            onChange={(e) => changeVial(e.target.value)}
            className="min-w-0 max-w-[65%] truncate bg-transparent font-mono text-[11.5px] text-muted outline-none"
          >
            <option value="">{t('doses.noInventory')}</option>
            {vials.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} · {fmtNumber(Number(v.remaining_mg), locale, 2)} mg
              </option>
            ))}
          </select>
        ) : (
          <span className="font-mono text-[11.5px] text-muted">{t('doses.noVial')}</span>
        )}
        {conversion && (
          <span className="readout text-[12.5px] font-semibold text-signal">{conversion}</span>
        )}
      </div>
      {partnerDoses.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-end gap-x-3 text-[12px] text-muted">
          {partnerDoses.map((p) => (
            <span key={p.compoundId} className="readout">
              {compoundById(p.compoundId)?.names.generic}{' '}
              <span className="font-semibold text-signal">
                {p.mg !== null ? fmtDose(p.mg, unitOf(p.compoundId), locale) : '—'}
              </span>
            </span>
          ))}
        </div>
      )}
      {vial && lineDoseMg !== null && lineDoseMg > Number(vial.remaining_mg) + 1e-9 && (
        <p className="mt-1.5 text-[12px] font-semibold text-warn">
          {t('doses.vialShort', {
            left: fmtDose(Number(vial.remaining_mg), unit, locale),
          })}
        </p>
      )}
    </div>
  )
}
