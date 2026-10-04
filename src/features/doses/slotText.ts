import type { TFunction } from 'i18next'
import type { PlannedDose } from '@/domain/dosing/schedule'
import { fmtDate, type Locale } from '@/lib/format'
import { slotParts } from './slotView'

type Slot = Pick<PlannedDose, 'at' | 'day'>

/** "lun 29": the day a planned administration belongs to (a night one, the evening before). */
export function slotDayText(slot: Slot, locale: Locale): string {
  return fmtDate(slotParts(slot).day, locale, 'EEE d')
}

/** "lun 29 · 01:00", or "lun 29 noche · 01:00" for a night slot: it reads as its evening. */
export function slotWhenText(slot: Slot, t: TFunction, locale: Locale): string {
  const { day, clock, night } = slotParts(slot)
  return t(night ? 'editDose.slot.atNight' : 'editDose.slot.at', {
    day: fmtDate(day, locale, 'EEE d'),
    time: clock,
  })
}

/** "lunes": the weekday of a planned administration, for sentences. */
export function slotWeekdayText(slot: Slot, locale: Locale): string {
  return fmtDate(slotParts(slot).day, locale, 'EEEE')
}
