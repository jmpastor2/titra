/**
 * Words for where a cycle stands: "semana 3 de 12", "descanso: quedan 3 semanas" and the
 * change that comes next. One hook so the cards, the sheets and the summary all say it the
 * same way. Phrases come in lower case; `sentence` capitalises one that starts a line.
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CycleChange } from '@/domain/dosing/cycle'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { remaining, type WeekReadout } from './readout'

export interface RingText {
  /** What goes in the middle of the ring; empty for a cycle that is over. */
  main: string
  sub: string | null
}

export function useCycleText() {
  const { t } = useTranslation()
  const { locale } = useLocale()

  return useMemo(() => {
    const phrase = (r: WeekReadout): string => {
      switch (r.kind) {
        case 'before':
          return t('cycles.phrase.before', { count: r.days })
        case 'dosing':
          return r.of
            ? t('cycles.phrase.dosing', { week: r.week, of: r.of })
            : t('cycles.phrase.week', { week: r.week })
        case 'maintenance':
          return t('cycles.phrase.maintenance', { week: r.week })
        case 'rest': {
          if (r.daysLeft === null) return t('cycles.phrase.restOpen')
          const left = remaining(r.daysLeft)
          return left.unit === 'weeks'
            ? t('cycles.phrase.restWeeks', { count: left.count })
            : t('cycles.phrase.restDays', { count: left.count })
        }
        case 'finished':
          return t('cycles.phrase.finished')
      }
    }

    /** The silkscreen label over a cycle's phase. `escalating` is a plan that ends in maintenance. */
    const phaseLabel = (r: WeekReadout, escalating: boolean): string => {
      switch (r.kind) {
        case 'before':
          return t('cycles.phase.before')
        case 'dosing':
          return escalating ? t('cycles.phase.escalating') : t('cycles.phase.dosing')
        case 'maintenance':
          return t('cycles.phase.maintenance')
        case 'rest':
          return t('cycles.phase.rest')
        case 'finished':
          return t('cycles.phase.finished')
      }
    }

    /** "Sube a 150 mcg mañana · lun 5 oct". `dose` is the dose after the change, if any. */
    const change = (next: CycleChange, dose: string | null): string => {
      const what = (() => {
        switch (next.kind) {
          case 'increase':
            return t('cycles.next.increase', { dose })
          case 'decrease':
            return t('cycles.next.decrease', { dose })
          case 'resume':
            return t('cycles.next.resume', { dose })
          case 'same':
            return t('cycles.next.same')
          case 'rest':
            return t('cycles.next.rest')
          case 'end':
            return t('cycles.next.end')
        }
      })()
      const when = t('cycles.when', {
        count: next.daysAway,
        date: fmtDate(next.on, locale, 'EEE d MMM'),
      })
      return `${what} ${when}`
    }

    const ring = (r: WeekReadout): RingText => {
      const weeks = t('protocols.weeksShort')
      const days = t('units.d')
      switch (r.kind) {
        case 'before':
          return { main: String(r.days), sub: days }
        case 'dosing':
          return { main: String(r.week), sub: r.of ? `/${r.of}` : weeks }
        case 'maintenance':
          return { main: String(r.week), sub: weeks }
        case 'rest': {
          if (r.daysLeft === null) return { main: '∞', sub: null }
          const left = remaining(r.daysLeft)
          return { main: String(left.count), sub: left.unit === 'weeks' ? weeks : days }
        }
        case 'finished':
          return { main: '', sub: null }
      }
    }

    /** "14 semanas · 10 de dosis + 4 de descanso"; just the weeks when there is no rest. */
    const span = (total: number, dose: number, rest: number): string =>
      rest > 0
        ? t('cycles.span', { total: t('common.weeks', { count: total }), dose, rest })
        : t('common.weeks', { count: total })

    /** The dosing weeks a step covers: "Semanas 3–12", "Semana 3", "Desde la semana 6". */
    const weekRange = (from: number | null, to: number | null): string => {
      if (from === null) return ''
      if (to === null) return t('cycles.weeks.from', { from })
      return from === to
        ? t('cycles.weeks.one', { n: from })
        : t('cycles.weeks.range', { from, to })
    }

    return { phrase, phaseLabel, change, ring, span, weekRange }
  }, [t, locale])
}
