import { addDays, differenceInCalendarDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { sentence } from '@/features/cycles/format'
import { titrationWeeks } from '@/features/cycles/readout'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { fmtDoseView, type CycleSummary, type DoseView } from './cycleView'

/**
 * The sentences about where a protocol stands, shared by the cards and the protocol page:
 * "Semana 3 de 12", "12 U (200 mcg)", "El lun 5 oct sube a 15 U".
 */
export function useCycleText() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const day = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  /** The dose as short as it reads: units when the vial is known, else the mass. */
  const doseShort = (v: DoseView) => {
    const { units, mass } = fmtDoseView(v, locale)
    return units ?? mass
  }

  /** "Semana 3 de 12", "Descanso · semana 2 de 4", "Empieza el lun 5 oct"… */
  function phase(s: CycleSummary): string {
    const { info } = s
    switch (info.phase) {
      case 'before':
        return t('protocols.cycle.notStarted')
      case 'finished':
        // The plan ends on its last day; the end date is the day after it.
        return t('protocols.cycle.finished', {
          date: day(addDays(info.endsOn ?? info.startsOn, -1)),
        })
      case 'rest':
        return s.rest?.of
          ? t('protocols.cycle.rest', { n: s.rest.n, total: s.rest.of })
          : t('protocols.cycle.restOpen', { n: s.rest?.n ?? 1 })
      case 'maintenance':
        return t('protocols.cycle.maintenance', { n: s.week?.n ?? info.week })
      default: {
        // A titration that ends in maintenance counts to its last step, as Ciclos does.
        const total = s.week?.of ?? titrationWeeks(info)
        return total
          ? t('protocols.cycle.weekOf', { n: s.week?.n ?? info.week, total })
          : t('protocols.cycle.week', { n: s.week?.n ?? info.week })
      }
    }
  }

  /** "sube el lun 5 a 17,5 U": the next change as the tail of a line; null when none follows. */
  function soon(s: CycleSummary, now: Date): string | null {
    if (!s.next) return null
    const { change, dose } = s.next
    // A date this week reads as its weekday; further off, with its month.
    const on = (d: Date) =>
      fmtDate(d, locale, differenceInCalendarDays(d, now) < 7 ? 'EEE d' : 'EEE d MMM')
    const date = on(change.on)
    const to = dose ? doseShort(dose) : ''
    if (s.info.phase === 'before') return t('protocols.soon.start', { date, dose: to })
    switch (change.kind) {
      case 'increase':
        return t('protocols.soon.increase', { date, dose: to })
      case 'decrease':
        return t('protocols.soon.decrease', { date, dose: to })
      case 'same':
        return t('protocols.soon.same', { date, n: (change.stepIndex ?? 0) + 1 })
      case 'rest':
        return t('protocols.soon.rest', { date })
      case 'resume':
        return t('protocols.soon.resume', { date, dose: to })
      case 'end':
        // The plan ends on its last day; the change is dated the day after it.
        return t('protocols.soon.end', { date: on(addDays(change.on, -1)) })
    }
  }

  /** "hoy" / "mañana" / "en 3 días": how far the next change is; null when nothing follows. */
  function nextWhen(s: CycleSummary): string | null {
    if (!s.next) return null
    const { change } = s.next
    const days = change.kind === 'end' ? change.daysAway - 1 : change.daysAway
    if (days < 0) return null
    return days === 0 ? t('protocols.cycle.today') : t('protocols.cycle.inDays', { count: days })
  }

  return {
    day,
    doseShort,
    phase,

    /**
     * One line under the dose: "Semana 4 de 7 · sube el lun 5 a 17,5 U". Without a dose (a
     * rest, before the start) the phase is the headline already, so the line is what comes
     * next and how soon: "Termina el dom 10 ene · en 21 días". Null when nothing is left to say.
     */
    line(s: CycleSummary, now: Date): string | null {
      const next = soon(s, now)
      if (s.dose) return next ? `${phase(s)} · ${next}` : phase(s)
      if (!next) return null
      const when = nextWhen(s)
      return `${sentence(next, locale)}${when ? ` · ${when}` : ''}`
    },

    /** "El lun 5 oct sube a 15 U": the next change in a sentence; null when nothing follows. */
    next(s: CycleSummary): string | null {
      if (!s.next) return null
      const { change, dose } = s.next
      const date = day(change.on)
      const to = dose ? doseShort(dose) : ''
      if (s.info.phase === 'before') return t('protocols.next.start', { date, dose: to })
      switch (change.kind) {
        case 'increase':
          return t('protocols.next.increase', { date, dose: to })
        case 'decrease':
          return t('protocols.next.decrease', { date, dose: to })
        case 'same':
          return t('protocols.next.same', { date, n: (change.stepIndex ?? 0) + 1, dose: to })
        case 'rest':
          return t('protocols.next.rest', { date })
        case 'resume':
          return t('protocols.next.resume', { date, dose: to })
        case 'end':
          // The plan ends on its last day; the change is dated the day after it.
          return t('protocols.next.end', { date: day(addDays(change.on, -1)) })
      }
    },

    /** "5 oct → 13 dic" for a step; "desde el 5 oct" when it has no end. */
    span(startsOn: Date, endsOn: Date | null, now: Date): string {
      const stamp = (d: Date) =>
        fmtDate(d, locale, d.getFullYear() === now.getFullYear() ? 'd MMM' : 'd MMM yyyy')
      return endsOn
        ? `${stamp(startsOn)} → ${stamp(addDays(endsOn, -1))}`
        : t('protocols.timeline.since', { date: stamp(startsOn) })
    },
    nextWhen,
  }
}
