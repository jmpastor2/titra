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
import { suggestNextSite } from '@/domain/sites/injectionSites'
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
  fmtDate,
  fmtDose,
  fmtNumber,
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { FastingCard } from '@/features/fasting/FastingCard'
import { needsFasting } from '@/features/fasting/fasting'
import { SitePicker } from '@/features/sites/SitePicker'
import { DrawGuide } from './DrawGuide'

export interface LogDoseSheetProps {
  open: boolean
  onClose: () => void
  /** Log an administration of this protocol (all its stack compounds). */
  protocolId?: string | null
  /** Free dose of a single compound, outside any protocol. */
  compoundId?: string
  /** The planned time of the administration being logged, to log it "on time" later. */
  plannedAt?: Date
}

type EntryMode = 'dose' | 'units'

interface Line {
  key: number
  compoundId: string
  amount: string
  mode: EntryMode
  /** Unit of `amount` in dose mode: mg or mcg for peptides, else the compound's own. */
  doseUnit: DoseUnit
  /** The protocol's dose for this line, for the quick pick. */
  plannedMg?: number
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
    d.site_id
      ? [{ siteId: d.site_id, at: new Date(d.administered_at), compoundId: d.compound_id }]
      : [],
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
  return {
    key: ++lineSeq,
    compoundId,
    amount,
    mode,
    doseUnit: unitOf(compoundId),
    ...(mg !== undefined ? { plannedMg: mg } : {}),
    inventoryId: vial?.id ?? '',
    partners: [],
  }
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
  at: Date = new Date(),
): Line[] {
  if (!protocol) return []
  const pl = toProtocolLike(protocol)
  // The dose of the step the administration belongs to, also when logging it late.
  const step = currentStep(pl, at)?.step ?? pl.steps[pl.steps.length - 1]
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
  plannedAt,
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
          plannedAt,
        )
      : initialCompoundId
        ? [makeLine(initialCompoundId, undefined, vials)]
        : [],
  )
  const [pickerOpen, setPickerOpen] = useState(!initialProtocolId && !initialCompoundId)
  // When the sheet opened: fixed for the life of the form.
  const [openedAt] = useState(() => Date.now())
  // Logging a dose well after its planned time: default to "at its time".
  const [whenMode, setWhenMode] = useState<'now' | 'planned' | 'custom'>(() =>
    plannedAt && Date.now() - plannedAt.getTime() > 45 * 60_000 ? 'planned' : 'now',
  )
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const [siteId, setSiteId] = useState(() => suggestNextSite(siteHistory(doses.data))?.siteId ?? '')
  const [notes, setNotes] = useState('')

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
    return toMg(v, l.doseUnit)
  }

  /** The last dose logged for a compound, for the quick pick. */
  function lastMgOf(compoundId: string): number | undefined {
    const last = (doses.data ?? []).find((d) => d.compound_id === compoundId)
    return last ? Number(last.dose_mg) : undefined
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
    const at = (
      whenMode === 'planned' && plannedAt
        ? plannedAt
        : whenMode === 'now'
          ? new Date()
          : fromDateTimeInputs(date, time)
    ).toISOString()
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
                lastMg={lastMgOf(l.compoundId)}
              />
            ))}
            {drawPlan && <DrawGuide plan={drawPlan} />}
            {needsFasting(lines.flatMap((l) => [l.compoundId, ...l.partners])) && (
              <FastingCard
                name={
                  active.find((p) => p.id === protocolId)?.name ??
                  lines.map((l) => compoundById(l.compoundId)?.names.generic).join(' + ')
                }
              />
            )}
          </div>

          <Field label={t('doses.when')}>
            {() => (
              <div className="flex flex-col gap-2">
                <Segmented<'now' | 'planned' | 'custom'>
                  value={whenMode}
                  onChange={setWhenMode}
                  size="sm"
                  options={[
                    { value: 'now', label: t('doses.now') },
                    ...(plannedAt && plannedAt.getTime() < openedAt
                      ? [
                          {
                            value: 'planned' as const,
                            label: t('doses.atPlanned', {
                              // A 01:00 night shot reads as the evening it belongs to.
                              time: `${
                                plannedAt.getHours() < 6
                                  ? t('doses.nightOf', {
                                      day: fmtDate(
                                        new Date(plannedAt.getTime() - 86_400_000),
                                        locale,
                                        'EEE',
                                      ),
                                    })
                                  : fmtDate(plannedAt, locale, 'EEE')
                              } ${String(plannedAt.getHours()).padStart(2, '0')}:${String(plannedAt.getMinutes()).padStart(2, '0')}`,
                            }),
                          },
                        ]
                      : []),
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
            <Field label={t('doses.site')}>
              {() => (
                <SitePicker
                  value={siteId}
                  onChange={setSiteId}
                  history={siteHistory(doses.data)}
                  now={
                    whenMode === 'now'
                      ? new Date(openedAt)
                      : whenMode === 'planned' && plannedAt
                        ? plannedAt
                        : fromDateTimeInputs(date, time)
                  }
                  compoundId={lines[0]?.compoundId}
                />
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

/** Entry units a line offers: syringe units when a vial allows it, plus mg and mcg. */
type Pick = 'units' | DoseUnit

function DoseLine({
  line,
  vials,
  locale,
  removable,
  onChange,
  onRemove,
  partnerDoses = [],
  lastMg,
}: {
  line: Line
  vials: readonly InventoryRow[]
  locale: 'es' | 'en'
  removable: boolean
  onChange: (p: Partial<Line>) => void
  onRemove: () => void
  /** Blend partners drawn with this line and the mg each one gets. */
  partnerDoses?: { compoundId: string; mg: number | null }[]
  /** mg of the last logged dose of this compound, for the quick pick. */
  lastMg?: number
}) {
  const { t } = useTranslation()
  const native = unitOf(line.compoundId)
  const vial = vials.find((v) => v.id === line.inventoryId)
  const concOf = (v: InventoryRow) => concentrationFor(v, line.compoundId)
  const conc = vial ? concOf(vial) : null
  const value = parse(line.amount)
  const canUseUnits = vials.some((v) => concOf(v))
  // Peptides are dosed in mg or mcg interchangeably; other units (IU…) stay as they are.
  const doseUnits: DoseUnit[] = native === 'mg' || native === 'mcg' ? ['mg', 'mcg'] : [native]
  const picks: Pick[] = [...(canUseUnits ? (['units'] as const) : []), ...doseUnits]
  const current: Pick = line.mode === 'units' ? 'units' : line.doseUnit

  /** mg of an amount typed in a given pick; null when it cannot be converted. */
  const mgOf = (amount: number, pick: Pick, c: number | null = conc) =>
    !(amount > 0) ? null : pick === 'units' ? (c ? unitsToMg(amount, c) : null) : toMg(amount, pick)
  /** The same mg written in a given pick. */
  const amountIn = (mg: number, pick: Pick, c: number | null) =>
    pick === 'units' ? (c ? plain(mgToUnits(mg, c)) : '') : plain(fromMg(mg, pick))

  const lineDoseMg = mgOf(value, current)

  // Live readout of the same dose in the other units.
  const others =
    lineDoseMg === null
      ? []
      : picks
          .filter((p) => p !== current && (p !== 'units' || conc))
          .map((p) =>
            p === 'units'
              ? `${fmtNumber(mgToUnits(lineDoseMg, conc!), locale, 1)} U`
              : fmtDose(lineDoseMg, p, locale),
          )

  function choose(pick: Pick) {
    if (pick === current) return
    // Convert what is typed so switching never silently changes the dose.
    let inventoryId = line.inventoryId
    let c = conc
    if (pick === 'units' && !c) {
      const target = vials.find((v) => concOf(v))
      if (target) {
        inventoryId = target.id
        c = concOf(target)
      }
    }
    const amount = lineDoseMg !== null ? amountIn(lineDoseMg, pick, c) : line.amount
    onChange(
      pick === 'units'
        ? { mode: 'units', amount, inventoryId }
        : { mode: 'dose', doseUnit: pick, amount, inventoryId },
    )
  }

  // Units only mean something against a vial: without one, fall back to the dose itself.
  function changeVial(inventoryId: string) {
    const next = vials.find((v) => v.id === inventoryId)
    const nextConc = next ? concOf(next) : null
    if (line.mode === 'units' && !nextConc) {
      const amount = lineDoseMg !== null ? amountIn(lineDoseMg, native, null) : line.amount
      onChange({ inventoryId, mode: 'dose', doseUnit: native, amount })
    } else if (line.mode === 'units' && nextConc && lineDoseMg !== null) {
      // Same dose from a vial of another strength: keep the dose, recompute the units.
      onChange({ inventoryId, amount: amountIn(lineDoseMg, 'units', nextConc) })
    } else {
      onChange({ inventoryId })
    }
  }

  /** Quick picks: the protocol's dose and the last one logged, in the current unit. */
  const quick = [
    line.plannedMg ? { key: 'plan', label: t('doses.quickPlan'), mg: line.plannedMg } : null,
    lastMg && Math.abs(lastMg - (line.plannedMg ?? -1)) > 1e-9
      ? { key: 'last', label: t('doses.quickLast'), mg: lastMg }
      : null,
  ].filter((q): q is { key: string; label: string; mg: number } => q !== null)

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
      <Input
        inputMode="decimal"
        aria-label={t('doses.dose')}
        value={line.amount}
        onChange={(e) => onChange({ amount: e.target.value })}
        suffix={current === 'units' ? 'U' : t(`units.${current}`)}
        className="readout bg-panel text-[22px] font-semibold"
      />
      {picks.length > 1 && (
        <Segmented<Pick>
          value={current}
          onChange={choose}
          size="sm"
          className="mt-2"
          options={picks.map((p) => ({
            value: p,
            label: p === 'units' ? t('doses.pickUnits') : t(`units.${p}`),
          }))}
        />
      )}
      {others.length > 0 && (
        <div className="readout mt-2 text-[13px] font-semibold text-signal">
          = {others.join(' · ')}
        </div>
      )}
      {quick.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() =>
                onChange({
                  amount: amountIn(q.mg, current, conc) || plain(fromMg(q.mg, native)),
                  ...(current === 'units' && !conc
                    ? { mode: 'dose' as const, doseUnit: native }
                    : {}),
                })
              }
              className="rounded-full border border-line-strong bg-panel px-2.5 py-1 text-[12px]"
            >
              <span className="text-muted">{q.label}</span>{' '}
              <span className="readout font-semibold">
                {conc ? `${fmtNumber(mgToUnits(q.mg, conc), locale, 1)} U · ` : ''}
                {fmtDose(q.mg, native, locale)}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-2">
        {vials.length > 0 ? (
          <select
            aria-label={t('doses.inventory')}
            value={line.inventoryId}
            onChange={(e) => changeVial(e.target.value)}
            className="w-full truncate bg-transparent font-mono text-[11.5px] text-muted outline-none"
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
      </div>
      {partnerDoses.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-muted">
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
            left: fmtDose(Number(vial.remaining_mg), native, locale),
          })}
        </p>
      )}
    </div>
  )
}
