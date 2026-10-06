/**
 * "Qué ha cambiado": the last seven days against the seven before, as short lines. What moved in
 * the body, the logging and the doses taken comes first; the dose steps that happened or are
 * about to are a block of their own below, each with the colour of its substance.
 */
import { isToday, isTomorrow, isYesterday } from 'date-fns'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate, fmtDose, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { KIND_DIGITS } from './kinds'
import { asDoseUnit } from './progress'
import { ChangeValue } from './ProgressCharts'
import { useBodyUnits, type BodyUnits } from './units'
import type { WeekItem } from './weekly'

type Tone = 'good' | 'bad' | 'warn' | 'info'
type StepItem = Extract<WeekItem, { kind: 'step' }>

const DOT_TONE: Record<Tone, string> = {
  good: 'var(--ok)',
  bad: 'var(--danger)',
  warn: 'var(--warn)',
  info: 'var(--muted)',
}

export function WeekCard({ items }: { items: readonly WeekItem[] }) {
  const { t } = useTranslation()
  const units = useBodyUnits()
  const facts = items.filter((i) => i.kind !== 'step')
  const steps = items.filter((i): i is StepItem => i.kind === 'step')
  return (
    <Card className="mt-2.5" eyebrow={t('progress.week.eyebrow')} title={t('progress.week.title')}>
      {items.length === 0 ? (
        <p className="text-[13px] text-muted">{t('progress.week.empty')}</p>
      ) : (
        <>
          {facts.length > 0 && (
            <ul className="flex flex-col gap-2">
              {facts.map((item) => (
                <FactLine key={factKey(item)} item={item} units={units} />
              ))}
            </ul>
          )}
          {steps.length > 0 && (
            <div className={facts.length > 0 ? 'mt-3 border-t border-line pt-3' : undefined}>
              <div className="spec mb-2">{t('progress.week.stepsLabel')}</div>
              <ul className="flex flex-col gap-2">
                {steps.map((item) => (
                  <StepLine key={`${item.protocolId}-${item.change.at.getTime()}`} item={item} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function factKey(item: WeekItem): string {
  return item.kind === 'body' ? `body-${item.metric}` : item.kind
}

/** i18n key of a day relative to today: "hoy", "mañana", "ayer" or "el lunes". */
function dayKey(at: Date): 'today' | 'tomorrow' | 'yesterday' | 'weekday' {
  if (isToday(at)) return 'today'
  if (isTomorrow(at)) return 'tomorrow'
  if (isYesterday(at)) return 'yesterday'
  return 'weekday'
}

function Line({ dot, children }: { dot: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-2.5 text-[13.5px] leading-snug text-ink-2">
      <span className="relative top-[-1px] shrink-0">{dot}</span>
      <span className="min-w-0">{children}</span>
    </li>
  )
}

function ToneDot({ tone }: { tone: Tone }) {
  return (
    <span
      className="block size-[7px] rounded-full"
      style={{ background: DOT_TONE[tone] }}
      aria-hidden
    />
  )
}

function FactLine({ item, units }: { item: WeekItem; units: BodyUnits }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  let tone: Tone = 'info'
  let content: ReactNode = null

  switch (item.kind) {
    case 'body':
      tone = Math.abs(item.delta) < 0.2 ? 'info' : item.delta < 0 ? 'good' : 'bad'
      content = (
        <>
          {t(`progress.summary.${item.metric}`)}{' '}
          <ChangeValue
            kind={item.metric}
            delta={item.delta}
            digits={KIND_DIGITS[item.metric]}
            unit={units.unit(item.metric)}
            threshold={0.2}
          />{' '}
          {t('progress.week.vsLast')}
        </>
      )
      break
    case 'weighIns':
      content = t('progress.week.weighIns', { count: item.count })
      break
    case 'adherence': {
      const ratio = item.expected > 0 ? item.taken / item.expected : 1
      tone = ratio >= 0.9 ? 'good' : 'warn'
      const values = {
        pct: fmtPercent(Math.min(1, ratio), locale),
        taken: item.taken,
        expected: item.expected,
      }
      content =
        item.offTime === null
          ? t('progress.week.adherence', values)
          : item.offTime === 0
            ? t('progress.week.adherenceOn', values)
            : t('progress.week.adherenceOff', { ...values, count: item.offTime })
      break
    }
    case 'score':
      content = (
        <>
          {t(`health.kinds.${item.metric}`)}{' '}
          <ChangeValue kind={item.metric} delta={item.delta} digits={1} threshold={0.5} trim />{' '}
          {t('progress.week.vsLast')}
        </>
      )
      break
    case 'checkIns':
      tone = 'good'
      content = t('progress.week.checkIns', { count: item.count })
      break
    case 'symptoms':
      tone = 'warn'
      content = (
        <>
          {t('progress.week.symptoms', { count: item.count })}
          {item.top &&
            t('progress.week.symptomsTop', {
              kind: t(`symptoms.kinds.${item.top}`).toLowerCase(),
            })}
        </>
      )
      break
    case 'step':
      return null
  }

  return <Line dot={<ToneDot tone={tone} />}>{content}</Line>
}

function StepLine({ item }: { item: StepItem }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const c = item.change
  const verb = `${c.kind}${item.upcoming ? '' : 'Past'}`
  return (
    <Line dot={<SubstanceDot color={compoundColor(item.compoundId)} size={7} />}>
      {t(`progress.week.step.${verb}`, {
        name: item.name,
        dose: fmtDose(c.doseMg, asDoseUnit(item.unit), locale),
        day: t(`progress.week.day.${dayKey(c.at)}`, {
          weekday: fmtDate(c.at, locale, locale === 'es' ? 'EEEE d MMM' : 'EEEE, MMM d'),
        }),
      })}
    </Line>
  )
}
