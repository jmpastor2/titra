/**
 * The lines of a dose form: what is injected, how much of it and from which vial. A line is
 * one draw: a blend vial is a single line whose partners ride along in the same liquid.
 * Shared by the log sheet (new rows) and the edit sheet (patches to existing rows).
 * Pure; see doseLines.test.ts.
 */
import { compoundById } from '@/content/compounds'
import type { Database, DoseRow, InventoryRow, ProtocolRow } from '@/data/database.types'
import { toProtocolLike } from '@/data/mappers'
import { planDraw, type DrawPlan } from '@/domain/dosing/draw'
import { mgToUnits, unitsToMg } from '@/domain/dosing/reconstitution'
import { componentsAt, currentStep } from '@/domain/dosing/schedule'
import type { DoseUnit } from '@/domain/types'
import {
  activeVial,
  concentrationFor,
  drawPartFor,
  isBlend,
  vialContents,
  vialHas,
} from '@/features/inventory/vials'
import type { DosePatch, DoseUpdate } from './patches'

type DoseInsert = Database['public']['Tables']['doses']['Insert']

export type EntryMode = 'dose' | 'units'

export interface Line {
  key: number
  compoundId: string
  /** What is typed: syringe units in `units` mode, else the dose in `doseUnit`. */
  amount: string
  mode: EntryMode
  /** Unit of `amount` in dose mode: mg or mcg for peptides, else the compound's own. */
  doseUnit: DoseUnit
  /** The protocol's dose for this line, for the quick pick. */
  plannedMg?: number
  /** The vial drawn from, '' for none. */
  inventoryId: string
  /** Other compounds drawn in the same liquid from the same blend vial. */
  partners: string[]
}

/* ------------------------------------------------------------------ amounts */

/** mg ↔ the compound's display unit (mcg is shown as mcg; mg, IU and U as stored). */
export function toMg(value: number, unit: DoseUnit): number {
  return unit === 'mcg' ? value / 1000 : value
}
export function fromMg(mg: number, unit: DoseUnit): number {
  return unit === 'mcg' ? mg * 1000 : mg
}
export function unitOf(compoundId: string): DoseUnit {
  return compoundById(compoundId)?.defaultUnit ?? 'mg'
}
export const parseAmount = (s: string): number => Number(s.replace(',', '.'))
export const plain = (n: number): string => String(Math.round(n * 1000) / 1000)

/** What an amount can be typed in: syringe units when a vial allows it, plus mg and mcg. */
export type Entry = 'units' | DoseUnit

/** mg of an amount typed in `entry`; null when it cannot be converted (units without a vial). */
export function entryMg(amount: number, entry: Entry, conc: number | null): number | null {
  if (!(amount > 0)) return null
  if (entry !== 'units') return toMg(amount, entry)
  return conc ? unitsToMg(amount, conc) : null
}

/** The same mg written in `entry` ('' for units without a known concentration). */
export function entryAmount(mg: number, entry: Entry, conc: number | null): string {
  if (entry !== 'units') return plain(fromMg(mg, entry))
  return conc ? plain(mgToUnits(mg, conc)) : ''
}

const sameMg = (a: number, b: number) => Math.abs(a - b) < 1e-9

/**
 * How to show `mg` to start with: in syringe units when the vial's concentration is known,
 * since that is what is drawn, else as the dose in the compound's own unit. Empty without `mg`.
 */
function startAmount(
  compoundId: string,
  conc: number | null,
  mg: number | undefined,
): Pick<Line, 'mode' | 'amount'> {
  const mode: EntryMode = conc ? 'units' : 'dose'
  if (mg === undefined) return { mode, amount: '' }
  return { mode, amount: entryAmount(mg, conc ? 'units' : unitOf(compoundId), conc) }
}

let lineSeq = 0

/* ------------------------------------------------------------------ building lines */

/** A line for one compound, from its active vial, with `mg` typed in when known. */
export function makeLine(
  compoundId: string,
  mg: number | undefined,
  vials: readonly InventoryRow[],
): Line {
  // With the dose known, a vial that cannot cover it gives way to one that can.
  const vial = activeVial(vials, compoundId, mg)
  const conc = vial ? concentrationFor(vial, compoundId) : null
  return {
    key: ++lineSeq,
    compoundId,
    ...startAmount(compoundId, conc, mg),
    doseUnit: unitOf(compoundId),
    ...(mg !== undefined ? { plannedMg: mg } : {}),
    inventoryId: vial?.id ?? '',
    partners: [],
  }
}

/**
 * One vial as a single line: its own compound is the line, the rest of a blend are its
 * partners, drawn together. `mg` is typed in when known; `plannedMg` feeds the quick pick.
 */
export function lineForVial(
  vial: InventoryRow,
  amounts: { mg?: number; plannedMg?: number } = {},
): Line {
  const [host, ...rest] = vialContents(vial)
  const compoundId = host?.compoundId ?? vial.compound_id
  return {
    key: ++lineSeq,
    compoundId,
    ...startAmount(compoundId, concentrationFor(vial, compoundId), amounts.mg),
    doseUnit: unitOf(compoundId),
    ...(amounts.plannedMg !== undefined ? { plannedMg: amounts.plannedMg } : {}),
    inventoryId: vial.id,
    partners: rest.map((c) => c.compoundId),
  }
}

/** Compounds of one blend vial become a single line: one draw, several doses. */
export function mergeBlends(lines: readonly Line[], vials: readonly InventoryRow[]): Line[] {
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

/** What a protocol administers at `at`: the primary compound and its stack, in mg. */
export function planDoses(
  protocol: ProtocolRow,
  at: Date = new Date(),
): { compoundId: string; mg: number | undefined }[] {
  const pl = toProtocolLike(protocol)
  // The dose of the step the administration belongs to, also when logging it late.
  const step = currentStep(pl, at)?.step ?? pl.steps[pl.steps.length - 1]
  const primaryMg = step && !step.pause ? step.doseMg : undefined
  return [
    { compoundId: protocol.compound_id, mg: primaryMg },
    ...componentsAt(pl, primaryMg ?? 0).map((c) => ({ compoundId: c.compoundId, mg: c.doseMg })),
  ]
}

/** The lines of one administration of a protocol: its stack, blends merged into one draw. */
export function linesForProtocol(
  protocol: ProtocolRow | undefined,
  vials: readonly InventoryRow[],
  at: Date = new Date(),
): Line[] {
  if (!protocol) return []
  return mergeBlends(
    planDoses(protocol, at).map((d) => makeLine(d.compoundId, d.mg, vials)),
    vials,
  )
}

/**
 * A line changed. A partner the new vial does not hold goes back to a line of its own,
 * with its own dose, so changing the vial never silently drops a compound.
 */
export function patchLine(
  lines: readonly Line[],
  key: number,
  patch: Partial<Line>,
  vials: readonly InventoryRow[],
): Line[] {
  return lines.flatMap((l) => {
    if (l.key !== key) return [l]
    const next = { ...l, ...patch }
    const vial = vials.find((v) => v.id === next.inventoryId)
    const stay = next.partners.filter((c) => vial && vialHas(vial, c))
    const leave = next.partners.filter((c) => !stay.includes(c))
    return [
      { ...next, partners: stay },
      ...leave.map((c) => makeLine(c, partnerMg(l, c, vials) ?? undefined, vials)),
    ]
  })
}

/** The last dose logged for a compound, newest first in `doses`, for the quick pick. */
export function lastMgOf(doses: readonly DoseRow[], compoundId: string): number | undefined {
  const last = doses.find((d) => d.compound_id === compoundId)
  return last ? Number(last.dose_mg) : undefined
}

/* ------------------------------------------------------------------ reading lines */

/** mg a line stands for, or null when it is not a valid positive amount. */
export function lineMg(line: Line, vials: readonly InventoryRow[]): number | null {
  const v = parseAmount(line.amount)
  if (!(v > 0)) return null
  if (line.mode === 'units') {
    const vial = vials.find((x) => x.id === line.inventoryId)
    const conc = vial ? concentrationFor(vial, line.compoundId) : null
    return conc ? unitsToMg(v, conc) : null
  }
  return toMg(v, line.doseUnit)
}

/** mg of a blend partner drawn with the line: same liquid, so the vial's own proportion. */
export function partnerMg(
  line: Line,
  partner: string,
  vials: readonly InventoryRow[],
): number | null {
  const mg = lineMg(line, vials)
  const vial = vials.find((x) => x.id === line.inventoryId)
  const contents = vial ? vialContents(vial) : []
  const own = contents.find((c) => c.compoundId === line.compoundId)?.mg
  const theirs = contents.find((c) => c.compoundId === partner)?.mg
  return mg !== null && own && theirs ? mg * (theirs / own) : null
}

/** What a log button can promise to register: syringe units, or one dose in its unit. */
export type LogAmount = { units: number } | { mg: number; unit: DoseUnit }

/**
 * The amount the log button names ("Registrar 15 U"): what was typed for a single line (the
 * units as typed, not the half-unit mark of the guide), the total draw for several lines in
 * one syringe, and nothing while any line is not a valid amount. A blend typed as a mass
 * names its units, since the mass of one compound would not be the whole dose.
 */
export function amountToLog(
  lines: readonly Line[],
  vials: readonly InventoryRow[],
  plan: DrawPlan | null,
): LogAmount | null {
  if (lines.length === 0 || lines.some((l) => lineMg(l, vials) === null)) return null
  const drawn = plan && plan.unknown.length === 0 ? { units: plan.totalUnits } : null
  const [only] = lines
  if (lines.length > 1 || !only) return drawn
  if (only.mode === 'units') return { units: parseAmount(only.amount) }
  return only.partners.length === 0
    ? { mg: toMg(parseAmount(only.amount), only.doseUnit), unit: only.doseUnit }
    : drawn
}

/** The draw of the lines in one syringe, for the syringe guide. */
export function drawPlanOf(
  lines: readonly Line[],
  vials: readonly InventoryRow[],
): DrawPlan | null {
  return planDraw(
    lines.flatMap((l) => {
      const vial = vials.find((v) => v.id === l.inventoryId)
      return [
        drawPartFor(vials, l.compoundId, lineMg(l, vials) ?? 0, vial),
        ...l.partners.map((c) => drawPartFor(vials, c, partnerMg(l, c, vials) ?? 0, vial)),
      ]
    }),
  )
}

/**
 * The compound whose row carries the vial (and so draws down its stock): the vial's own,
 * the partners ride along. When the vial's own compound is not part of the line, the line's.
 */
export function carrierOf(
  line: Pick<Line, 'compoundId' | 'partners'>,
  vial: InventoryRow | undefined,
): string {
  if (!vial || line.partners.length === 0) return line.compoundId
  return [line.compoundId, ...line.partners].includes(vial.compound_id)
    ? vial.compound_id
    : line.compoundId
}

/* ------------------------------------------------------------------ new rows */

export interface InsertBase {
  patientId: string
  protocolId: string | null
  at: Date
  siteId: string | null
  notes: string | null
  /** The planned administration the dose covers; null lets its time decide. */
  plannedAt: Date | null
}

/**
 * The dose rows to insert for the lines: one per compound, a blend's partners included,
 * with the vial on the carrier's row only. Null when an amount is not valid.
 */
export function buildInsertRows(
  base: InsertBase,
  lines: readonly Line[],
  vials: readonly InventoryRow[],
): DoseInsert[] | null {
  const rows: DoseInsert[] = []
  for (const line of lines) {
    const mg = lineMg(line, vials)
    if (mg === null) return null
    const members = [{ compoundId: line.compoundId, mg }]
    for (const partner of line.partners) {
      const partnerDose = partnerMg(line, partner, vials)
      if (partnerDose === null) return null
      members.push({ compoundId: partner, mg: partnerDose })
    }
    const carrier = carrierOf(
      line,
      vials.find((v) => v.id === line.inventoryId),
    )
    for (const m of members)
      rows.push({
        patient_id: base.patientId,
        protocol_id: base.protocolId,
        compound_id: m.compoundId,
        dose_mg: m.mg,
        administered_at: base.at.toISOString(),
        site_id: base.siteId,
        inventory_id: m.compoundId === carrier ? line.inventoryId || null : null,
        planned_at: base.plannedAt ? base.plannedAt.toISOString() : null,
        notes: base.notes,
      })
  }
  return rows
}

/* ------------------------------------------------------------------ editing rows */

/** A line made of existing rows: the one that drew from the vial and the ones riding along. */
export interface EditLine extends Line {
  hostRow: DoseRow
  partnerRows: DoseRow[]
  /** What was loaded, to tell an untouched dose from an edited one. */
  initial: Pick<Line, 'amount' | 'mode' | 'doseUnit' | 'inventoryId'>
}

function editLine(row: DoseRow, partnerRows: DoseRow[], vial: InventoryRow | undefined): EditLine {
  const initial = {
    ...startAmount(
      row.compound_id,
      vial ? concentrationFor(vial, row.compound_id) : null,
      Number(row.dose_mg),
    ),
    doseUnit: unitOf(row.compound_id),
    inventoryId: row.inventory_id ?? '',
  }
  return {
    ...initial,
    key: ++lineSeq,
    compoundId: row.compound_id,
    partners: partnerRows.map((r) => r.compound_id),
    hostRow: row,
    partnerRows,
    initial,
  }
}

/**
 * The lines of an existing administration. The rows of a blend ride along with the one that
 * drew from its vial; any other row is a line of its own.
 */
export function editLines(rows: readonly DoseRow[], vials: readonly InventoryRow[]): EditLine[] {
  const taken = new Set<string>()
  const lines: EditLine[] = []
  // The row that drew from a vial claims the rows riding along with it, so it goes first.
  const ordered = rows.toSorted(
    (a, b) => Number(Boolean(b.inventory_id)) - Number(Boolean(a.inventory_id)),
  )
  for (const row of ordered) {
    if (taken.has(row.id)) continue
    taken.add(row.id)
    const vial = row.inventory_id ? vials.find((v) => v.id === row.inventory_id) : undefined
    const partnerRows =
      vial && isBlend(vial)
        ? ordered.filter(
            (r) =>
              !taken.has(r.id) &&
              r.compound_id !== row.compound_id &&
              vialHas(vial, r.compound_id) &&
              (!r.inventory_id || r.inventory_id === vial.id),
          )
        : []
    for (const r of partnerRows) taken.add(r.id)
    lines.push(editLine(row, partnerRows, vial))
  }
  return lines
}

/** mg of the line's own row: what was stored while nothing was touched, else what is typed. */
export function editedMg(line: EditLine, vials: readonly InventoryRow[]): number | null {
  const { initial } = line
  const untouched =
    line.amount === initial.amount &&
    line.mode === initial.mode &&
    line.doseUnit === initial.doseUnit
  return untouched ? Number(line.hostRow.dose_mg) : lineMg(line, vials)
}

/** One row of the administration and the dose it will carry. */
export interface Member {
  row: DoseRow
  mg: number
}

/**
 * Every row of an edited line with its dose: the line's own, and its partners, which keep
 * their stored dose until the draw changes and then follow the vial's proportion.
 */
export function editedMembers(
  line: EditLine,
  vials: readonly InventoryRow[],
): [Member, ...Member[]] | null {
  const host = editedMg(line, vials)
  if (host === null) return null
  const sameDraw =
    line.inventoryId === line.initial.inventoryId && sameMg(host, Number(line.hostRow.dose_mg))
  const members: Member[] = []
  for (const row of line.partnerRows) {
    const mg = sameDraw ? Number(row.dose_mg) : partnerMg(line, row.compound_id, vials)
    if (mg === null) return null
    members.push({ row, mg })
  }
  return [{ row: line.hostRow, mg: host }, ...members]
}

export interface EditedLine {
  members: [Member, ...Member[]]
  /** The vial drawn from, '' for none. */
  inventoryId: string
}

export interface EditValues {
  at: Date
  /** '' for no site. */
  siteId: string
  notes: string
  /** The planned administration the dose covers, null to let its time decide; undefined leaves it alone. */
  plannedAt?: Date | null
  /** Linked when a free dose is assigned to one of a protocol's administrations. */
  protocolId?: string | null
  lines: readonly EditedLine[]
}

const msOf = (iso: string | null) => (iso ? new Date(iso).getTime() : null)

/**
 * The update of every row that changed, nothing for the rest. The shared fields (time, site,
 * notes, planned administration) go to every row of the administration; the dose is each
 * row's own. Changing the vial keeps the invariant: only the carrier's row names the vial,
 * the partners' rows are cleared. Stock is adjusted by the database, never here.
 */
export function buildEditPatches(values: EditValues, vials: readonly InventoryRow[]): DosePatch[] {
  const at = values.at.getTime()
  const site = values.siteId || null
  const notes = values.notes.trim() || null
  const out: DosePatch[] = []

  for (const line of values.lines) {
    const [host, ...rest] = line.members
    const vialChanged = line.inventoryId !== (host.row.inventory_id ?? '')
    const carrier = carrierOf(
      { compoundId: host.row.compound_id, partners: rest.map((m) => m.row.compound_id) },
      vials.find((v) => v.id === line.inventoryId),
    )
    for (const { row, mg } of line.members) {
      const patch: DoseUpdate = {}
      if (!sameMg(mg, Number(row.dose_mg))) patch.dose_mg = mg
      if (msOf(row.administered_at) !== at) patch.administered_at = values.at.toISOString()
      if ((row.site_id ?? null) !== site) patch.site_id = site
      if ((row.notes ?? null) !== notes) patch.notes = notes
      if (
        values.plannedAt !== undefined &&
        msOf(row.planned_at) !== (values.plannedAt?.getTime() ?? null)
      )
        patch.planned_at = values.plannedAt ? values.plannedAt.toISOString() : null
      if (values.protocolId && !row.protocol_id) patch.protocol_id = values.protocolId
      if (vialChanged) {
        const target = row.compound_id === carrier ? line.inventoryId || null : null
        if ((row.inventory_id ?? null) !== target) patch.inventory_id = target
      }
      if (Object.keys(patch).length > 0) out.push({ id: row.id, patch })
    }
  }
  return out
}
