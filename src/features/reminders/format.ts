import type { TFunction } from 'i18next'
import { compoundById } from '@/content/compounds'
import type { ReminderInput } from '@/data/database.types'
import { doseInline } from '@/features/cycle/dose'
import { fmtDose, fmtNumber, type Locale } from '@/lib/format'
import { DECISION_COMPOUND_ID, type UpcomingAdministration, type UpcomingDecision } from './plan'

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id
const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** Notification text for one administration: what, how much, how many units, when. */
export function reminderText(
  u: UpcomingAdministration,
  leadMin: number,
  t: TFunction,
  locale: Locale,
): { title: string; body: string } {
  const names = u.doses.map((d) => nameOf(d.compoundId)).join(' + ')
  const dose = u.doses
    .map((d) => fmtDose(d.doseMg, compoundById(d.compoundId)?.defaultUnit ?? 'mg', locale))
    .join(' + ')
  const time = hhmm(u.at)
  const n = (x: number) => fmtNumber(x, locale, 1)

  const title =
    leadMin > 0
      ? t('reminders.pushTitleSoon', { names, min: leadMin })
      : t('reminders.pushTitle', { names })

  let body: string
  if (u.loads && u.loads.length > 1) {
    body = t('reminders.pushBodyStack', {
      dose,
      total: n(u.totalUnits ?? 0),
      loads: u.loads.map((l) => `${nameOf(l.compoundId)} ${n(l.units)} U`).join(' + '),
      time,
    })
  } else if (u.totalUnits !== null) {
    body = t('reminders.pushBodyUnits', { dose, total: n(u.totalUnits), time })
  } else {
    body = t('reminders.pushBody', { dose, time })
  }
  return { title, body }
}

/** Row for replace_reminders(): the link opens the log sheet for this protocol. */
export function toReminderInput(
  u: UpcomingAdministration,
  leadMin: number,
  t: TFunction,
  locale: Locale,
): ReminderInput {
  return {
    protocol_id: u.protocol.id,
    occurrence_at: u.at.toISOString(),
    fire_at: u.fireAt.toISOString(),
    compound_id: u.protocol.compound_id,
    ...reminderText(u, leadMin, t, locale),
    url: `#/?log=${u.protocol.id}`,
    tolerance_minutes: u.toleranceMin,
  }
}

/** Notification text for a dose-increase decision: which dose goes up, from what to what. */
export function decisionText(
  d: UpcomingDecision,
  t: TFunction,
  locale: Locale,
): { title: string; body: string } {
  const unit = compoundById(d.protocol.compound_id)?.defaultUnit ?? 'mg'
  return {
    title: t('reminders.decisionTitle'),
    body: t('reminders.decisionBody', {
      name: d.protocol.name || nameOf(d.protocol.compound_id),
      from: doseInline(d.from, unit, locale),
      to: doseInline(d.to, unit, locale),
    }),
  }
}

/**
 * Row for replace_reminders(): the evening before the step-up. `compound_id` is one no dose
 * has, so the server never skips it as already taken; the link opens the decision on Today.
 */
export function toDecisionInput(d: UpcomingDecision, t: TFunction, locale: Locale): ReminderInput {
  return {
    protocol_id: d.protocol.id,
    occurrence_at: d.occurrenceAt.toISOString(),
    fire_at: d.fireAt.toISOString(),
    compound_id: DECISION_COMPOUND_ID,
    ...decisionText(d, t, locale),
    url: `#/?cycle=${d.protocol.id}`,
    tolerance_minutes: 0,
  }
}

/** A reminder the device shows itself while the app is open: the push text, when and where to. */
export interface LocalReminder {
  /** One per occurrence, so the same reminder is never shown twice. */
  id: string
  fireAt: Date
  title: string
  body: string
  /** Notifications with the same tag replace each other. */
  tag: string
  url: string
}

export function localAdministration(
  u: UpcomingAdministration,
  leadMin: number,
  t: TFunction,
  locale: Locale,
): LocalReminder {
  return {
    id: `${u.protocol.id}.${u.at.getTime()}`,
    fireAt: u.fireAt,
    ...reminderText(u, leadMin, t, locale),
    tag: `titra-${u.protocol.id}`,
    url: `#/?log=${u.protocol.id}`,
  }
}

export function localDecision(d: UpcomingDecision, t: TFunction, locale: Locale): LocalReminder {
  return {
    id: `${d.protocol.id}.${d.occurrenceAt.getTime()}`,
    fireAt: d.fireAt,
    ...decisionText(d, t, locale),
    tag: `titra-cycle-${d.protocol.id}`,
    url: `#/?cycle=${d.protocol.id}`,
  }
}
