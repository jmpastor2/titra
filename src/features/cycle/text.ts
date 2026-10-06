/**
 * The words of the cycle card: a headline, the next change and the decision, in the person's
 * language and units. Pure apart from `t`; see text.test.ts.
 */
import type { TFunction } from 'i18next'
import { compoundById } from '@/content/compounds'
import type { InventoryRow, ProtocolRow } from '@/data/database.types'
import { protocolCompoundIds } from '@/data/mappers'
import type { CycleStep } from '@/domain/dosing/cycle'
import type { DoseUnit, ProtocolLike } from '@/domain/types'
import { fmtDate, type Locale } from '@/lib/format'
import type { CycleDecision } from './decision'
import { doseInline, doseMain, doseShift, stepDose, type StepDose } from './dose'
import type { Headline, NextLine } from './view'

/** The protocol's name, or the substances it holds when it has none. */
export function protocolTitle(protocol: ProtocolRow): string {
  return (
    protocol.name ||
    protocolCompoundIds(protocol)
      .map((id) => compoundById(id)?.names.generic ?? id)
      .join(' + ')
  )
}

export function headlineText(h: Headline, t: TFunction, locale: Locale): string {
  switch (h.kind) {
    case 'before':
      return t('cycle.headline.before', { date: fmtDate(h.on, locale, 'EEE d MMM') })
    case 'week':
      return t('cycle.headline.week', { week: h.week, total: h.total })
    case 'step':
      return t('cycle.headline.step', { week: h.week, step: h.step, steps: h.steps })
    case 'rest':
      return h.total === null
        ? t('cycle.headline.restOpen', { week: h.week })
        : t('cycle.headline.rest', { week: h.week, total: h.total })
    case 'maintenance':
      return t('cycle.headline.maintenance', { week: h.week })
    case 'finished':
      return t('cycle.headline.finished')
  }
}

/** "en 3 días": how far away a change is. */
export function inDaysText(days: number, t: TFunction): string {
  return t('cycle.inDays', { count: days })
}

/** "hoy", "mañana" or "en 3 días". */
export function whenText(days: number, t: TFunction): string {
  if (days <= 0) return t('cycle.when.today')
  return days === 1 ? t('cycle.when.tomorrow') : inDaysText(days, t)
}

/** The next change in one line: "El lun 5 sube a 12 U". `dose` words a step's dose. */
export function nextText(
  n: NextLine,
  dose: (step: CycleStep) => string,
  t: TFunction,
  locale: Locale,
): string {
  // "lun 5" stays on one line wherever the sentence wraps.
  const day = (d: Date) => fmtDate(d, locale, 'EEE d').replace(' ', '\u00A0')
  switch (n.kind) {
    case 'increase':
    case 'decrease':
    case 'resume':
      return t(`cycle.next.${n.kind}`, { date: day(n.on), dose: dose(n.to) })
    case 'start':
      return t('cycle.next.start', { dose: dose(n.to) })
    case 'same':
      return t('cycle.next.same', { date: day(n.on), step: n.step })
    case 'rest':
    case 'end':
      return t(`cycle.next.${n.kind}`, { date: day(n.on) })
    case 'ended':
      return n.on ? t('cycle.next.ended', { date: fmtDate(n.on, locale, 'EEE d MMM') }) : ''
    case 'none':
      return t('cycle.next.none')
  }
}

/** Both sides of a decision as the person draws them. A pause has no dose. */
export function decisionDoses(
  d: CycleDecision,
  protocol: ProtocolLike,
  vials: readonly InventoryRow[],
): { from: StepDose | null; to: StepDose | null } {
  const of = (s: CycleStep | null) => (s && !s.pause ? stepDose(protocol, vials, s.doseMg) : null)
  return { from: of(d.from), to: of(d.to) }
}

/** A decision in a few words, for a folded row: "Sube a 12 U", "Empieza el descanso". */
export function decisionShort(
  d: CycleDecision,
  doses: { from: StepDose | null; to: StepDose | null },
  unit: DoseUnit,
  t: TFunction,
  locale: Locale,
): string {
  switch (d.kind) {
    case 'increase':
    case 'resume':
      return doses.to
        ? t(`cycle.short.${d.kind}`, { dose: doseMain(doses.to, unit, locale) })
        : t('cycle.decision.pending')
    case 'rest':
    case 'end':
    case 'finished':
      return t(`cycle.short.${d.kind}`)
  }
}

/** The decision in a sentence: "El lunes 5 sube de 9 U a 12 U (150 → 200 mcg)." */
export function decisionSentence(
  d: CycleDecision,
  doses: { from: StepDose | null; to: StepDose | null },
  unit: DoseUnit,
  t: TFunction,
  locale: Locale,
): string {
  const date = fmtDate(d.on, locale, 'EEEE d')
  const today = d.timing === 'today'
  const { from, to } = doses
  switch (d.kind) {
    case 'increase': {
      if (!from || !to) return ''
      const detail = doseShift(from, to, unit, locale)
      const key = `cycle.decision.increase${today ? 'Today' : ''}${detail ? 'Detail' : ''}`
      return t(key, {
        date,
        from: doseMain(from, unit, locale),
        to: doseMain(to, unit, locale),
        detail,
      })
    }
    case 'rest':
      return t(today ? 'cycle.decision.restToday' : 'cycle.decision.rest', { date })
    case 'resume':
      return t(today ? 'cycle.decision.resumeToday' : 'cycle.decision.resume', {
        date,
        dose: to ? doseInline(to, unit, locale) : '',
      })
    case 'end':
      return t(d.from?.pause ? 'cycle.decision.endRest' : 'cycle.decision.end', { date })
    case 'finished':
      return t(d.from?.pause ? 'cycle.decision.finishedRest' : 'cycle.decision.finished')
  }
}
