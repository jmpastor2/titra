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
