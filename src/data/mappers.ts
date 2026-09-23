import type { DoseEvent, ProtocolLike, ScheduleStep } from '@/domain/types'
import type { DoseRow, ProtocolRow } from './database.types'

export function toDoseEvent(row: DoseRow): DoseEvent {
  return { at: new Date(row.administered_at), mg: Number(row.dose_mg) }
}

export function parseSteps(json: unknown): ScheduleStep[] {
  if (!Array.isArray(json)) return []
  return json
    .map((s): ScheduleStep | null => {
      if (!s || typeof s !== 'object') return null
      const o = s as Record<string, unknown>
      const doseMg = Number(o.doseMg)
      const intervalDays = Number(o.intervalDays)
      if (!(doseMg > 0) || !(intervalDays > 0)) return null
      const durationWeeks =
        o.durationWeeks === null || o.durationWeeks === undefined ? null : Number(o.durationWeeks)
      return {
        doseMg,
        intervalDays,
        durationWeeks: durationWeeks === null || Number.isNaN(durationWeeks) ? null : durationWeeks,
        label: typeof o.label === 'string' ? o.label : undefined,
      }
    })
    .filter((s): s is ScheduleStep => s !== null)
}

export function toProtocolLike(row: ProtocolRow): ProtocolLike {
  return {
    compoundId: row.compound_id,
    startDate: row.start_date,
    steps: parseSteps(row.steps),
    timeOfDay: row.time_of_day.slice(0, 5),
  }
}
