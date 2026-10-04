import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type { SymptomKind } from '@/data/database.types'

/** Display order for the symptom picker: GLP-1 GI effects first, then systemic. */
export const SYMPTOM_KINDS: readonly SymptomKind[] = [
  'nausea',
  'vomiting',
  'diarrhea',
  'constipation',
  'reflux',
  'bloating',
  'abdominal_pain',
  'appetite_loss',
  'food_noise',
  'fatigue',
  'dizziness',
  'headache',
  'hypoglycemia',
  'palpitations',
  'injection_site_reaction',
  'mood_change',
  'hair_loss',
  'other',
]

export function severityTone(severity: number): 'danger' | 'warn' | 'ok' {
  if (severity >= 7) return 'danger'
  if (severity >= 4) return 'warn'
  return 'ok'
}

/** Offered first when there is no history yet: what GLP-1 therapy most often brings. */
export const COMMON_KINDS: readonly SymptomKind[] = [
  'nausea',
  'constipation',
  'reflux',
  'fatigue',
  'headache',
]

/** Symptoms are stored 0 to 10; the picker has five big levels, stored as 2 4 6 8 10. */
export const SEVERITY_LEVELS = [2, 4, 6, 8, 10] as const

/** The picker level (1 to 5) of a stored severity. */
export function levelOf(severity: number): number {
  return Math.min(5, Math.max(1, Math.ceil(severity / 2)))
}

/** The stored severity of a picker level. */
export function severityOf(level: number): number {
  return SEVERITY_LEVELS[Math.min(5, Math.max(1, level)) - 1] ?? 2
}

/** The person's own most frequent symptoms first, padded with the common ones. */
export function habitualKinds(rows: readonly { kind: SymptomKind }[], count = 5): SymptomKind[] {
  const tally = new Map<SymptomKind, number>()
  for (const r of rows) tally.set(r.kind, (tally.get(r.kind) ?? 0) + 1)
  const own = [...tally.entries()]
    .toSorted((a, b) => b[1] - a[1] || SYMPTOM_KINDS.indexOf(a[0]) - SYMPTOM_KINDS.indexOf(b[0]))
    .map(([kind]) => kind)
  return [...new Set([...own, ...COMMON_KINDS])].slice(0, count)
}

export interface RepeatSymptom {
  kind: SymptomKind
  severity: number
}

/**
 * What the last day with symptoms (within `withinDays`, today excluded) looked like, one
 * entry per symptom at its worst: the "igual que ayer" shortcut.
 */
export function lastDaySymptoms(
  rows: readonly { kind: SymptomKind; severity: number; occurred_at: string }[],
  now: Date,
  withinDays = 3,
): { daysAgo: number; items: RepeatSymptom[] } | null {
  const today = startOfDay(now)
  const past = rows
    .map((r) => ({ ...r, ago: differenceInCalendarDays(today, new Date(r.occurred_at)) }))
    .filter((r) => r.ago >= 1 && r.ago <= withinDays)
  if (!past.length) return null
  const nearest = Math.min(...past.map((r) => r.ago))
  const worst = new Map<SymptomKind, number>()
  for (const r of past.filter((p) => p.ago === nearest)) {
    worst.set(r.kind, Math.max(worst.get(r.kind) ?? 0, r.severity))
  }
  return {
    daysAgo: nearest,
    items: [...worst.entries()]
      .map(([kind, severity]) => ({ kind, severity }))
      .toSorted((a, b) => b.severity - a.severity),
  }
}
