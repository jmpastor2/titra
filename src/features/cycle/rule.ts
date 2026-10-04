/**
 * The person's own rule for going up: with nausea or vomiting, they do not. The app does not
 * judge; it only shows what they logged this week against that rule. Pure; see rule.test.ts.
 */
import { subDays } from 'date-fns'
import type { SymptomKind, SymptomRow } from '@/data/database.types'

/** What the rule is about. */
export const RULE_SYMPTOMS: readonly SymptomKind[] = ['nausea', 'vomiting']

export interface RuleHit {
  kind: SymptomKind
  /** How many times it was logged. */
  count: number
}

/** The symptoms of the rule that were logged in the last `days` days, with how often. */
export function ruleHits(rows: readonly SymptomRow[], now: Date, days = 7): RuleHit[] {
  const from = subDays(now, days).getTime()
  const to = now.getTime()
  return RULE_SYMPTOMS.flatMap((kind) => {
    const count = rows.filter((r) => {
      const at = new Date(r.occurred_at).getTime()
      return r.kind === kind && at >= from && at <= to
    }).length
    return count > 0 ? [{ kind, count }] : []
  })
}
