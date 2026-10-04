import { addDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
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

  return {
    day,
    doseShort,

    /** "Semana 3 de 12", "Descanso · semana 2 de 4", "Empieza el lun 5 oct"… */
    phase(s: CycleSummary): string {
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
        default:
          return s.week?.of
            ? t('protocols.cycle.weekOf', { n: s.week.n, total: s.week.of })
            : t('protocols.cycle.week', { n: s.week?.n ?? info.week })
      }
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

    /** "hoy" / "mañana" / "en 3 días": how far the next change is; null when nothing follows. */
    nextWhen(s: CycleSummary): string | null {
      if (!s.next) return null
      const { change } = s.next
      const days = change.kind === 'end' ? change.daysAway - 1 : change.daysAway
      if (days < 0) return null
      return days === 0 ? t('protocols.cycle.today') : t('protocols.cycle.inDays', { count: days })
    },
  }
}
