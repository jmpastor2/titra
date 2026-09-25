import type { TFunction } from 'i18next'
import { compoundById } from '@/content/compounds'
import type { ReminderInput } from '@/data/database.types'
import { fmtDose, fmtNumber, type Locale } from '@/lib/format'
import type { UpcomingAdministration } from './plan'

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
