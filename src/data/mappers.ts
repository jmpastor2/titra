/**
 * Boundary between database rows and domain types. JSON columns are parsed
 * defensively: rows written by older app versions or by hand in the SQL editor
 * must never crash the schedule engine.
 */
import { normaliseTimes } from '@/domain/dosing/schedule'
import type { DoseEvent, ProtocolLike, ScheduleStep, StackComponent } from '@/domain/types'
import type { DoseRow, ProtocolRow, SavedProtocolRow } from './database.types'

export function toDoseEvent(row: DoseRow): DoseEvent {
  return { at: new Date(row.administered_at), mg: Number(row.dose_mg) }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function parseSteps(json: unknown): ScheduleStep[] {
  if (!Array.isArray(json)) return []
  return json.flatMap((s): ScheduleStep[] => {
    if (!isRecord(s)) return []
    const pause = s.pause === true
    const doseMg = pause ? 0 : Number(s.doseMg)
    const intervalDays = Number(s.intervalDays ?? 1)
    const weekdays = Array.isArray(s.weekdays)
      ? [
          ...new Set(s.weekdays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
        ].toSorted()
      : []
    if (!pause && !(doseMg > 0)) return []
    if (!pause && weekdays.length === 0 && !(intervalDays > 0)) return []
    const weeks =
      s.durationWeeks === null || s.durationWeeks === undefined ? null : Number(s.durationWeeks)
    return [
      {
        doseMg,
        intervalDays: intervalDays > 0 ? intervalDays : 1,
        durationWeeks: weeks === null || !Number.isFinite(weeks) || weeks <= 0 ? null : weeks,
        ...(weekdays.length ? { weekdays } : {}),
        ...(pause ? { pause: true } : {}),
        ...(typeof s.label === 'string' && s.label.trim() ? { label: s.label.trim() } : {}),
      },
    ]
  })
}

export function parseComponents(json: unknown): StackComponent[] {
  if (!Array.isArray(json)) return []
  return json.flatMap((c): StackComponent[] => {
    if (!isRecord(c) || typeof c.compoundId !== 'string') return []
    const doseMg = Number(c.doseMg)
    return doseMg > 0 ? [{ compoundId: c.compoundId, doseMg }] : []
  })
}

/** `times` supersedes the legacy single `time_of_day` column. */
function protocolTimes(row: Pick<ProtocolRow, 'times' | 'time_of_day'>): string[] {
  if (Array.isArray(row.times) && row.times.length) return normaliseTimes(row.times)
  return normaliseTimes([row.time_of_day?.slice(0, 5) ?? '09:00'])
}

export function toProtocolLike(row: ProtocolRow): ProtocolLike {
  return {
    compoundId: row.compound_id,
    startDate: row.start_date,
    steps: parseSteps(row.steps),
    times: protocolTimes(row),
    components: parseComponents(row.components),
  }
}

/** Every compound administered by a protocol: the primary one first. */
export function protocolCompoundIds(row: ProtocolRow): string[] {
  return [row.compound_id, ...parseComponents(row.components).map((c) => c.compoundId)]
}

export function savedToProtocolLike(row: SavedProtocolRow, startDate: string): ProtocolLike {
  return {
    compoundId: row.compound_id,
    startDate,
    steps: parseSteps(row.steps),
    times: normaliseTimes(row.times),
    components: parseComponents(row.components),
  }
}
