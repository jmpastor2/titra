import { clsx } from 'clsx'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { useProtocols } from '@/data/hooks'
import { fmtDose } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { useCycleText } from './cycleText'
import { buildCycleViews } from './model'
import { summaryLines, type SummaryLine } from './readout'

/** More cycles in progress than this fold into "+N" and the full screen. */
const MAX_LINES = 4

/**
 * Where each cycle in progress stands, one line each ("CJC-1295 + Ipamorelina · semana 3 de
 * 12") with the change that comes next. It links to the Ciclos screen. Nothing shows without
 * a cycle in progress. Compact enough to sit on any screen.
 */
export function CyclesSummaryCard({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const { patientId, readOnly } = usePatientScope()
  const protocols = useProtocols(patientId)
  const now = useNow()
  const lines = useMemo(
    () => summaryLines(buildCycleViews(protocols.data ?? [], now), now),
    [protocols.data, now],
  )

  if (protocols.isPending) {
    return (
      <div className={clsx('card p-4', className)} aria-hidden>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-10 w-full" />
      </div>
    )
  }
  if (lines.length === 0) return null

  const nextText = (line: SummaryLine): string | null => {
    const { next, readout } = line
    if (!next || (readout.kind !== 'dosing' && readout.kind !== 'maintenance')) return null
    const unit = compoundById(line.compoundIds[0] ?? '')?.defaultUnit ?? 'mg'
    return text.change(next, next.doseMg ? fmtDose(next.doseMg, unit, locale) : null)
  }

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="spec">{t('cycles.summary.title')}</h2>
        {!readOnly && (
          <span className="spec flex items-center gap-0.5 text-signal">
            {t('cycles.summary.all')}
            <ChevronRight aria-hidden className="size-3" />
          </span>
        )}
      </div>
      <ul className="mt-2.5 flex flex-col divide-y divide-line">
        {lines.slice(0, MAX_LINES).map((line) => {
          const next = nextText(line)
          return (
            <li key={line.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline gap-1.5">
                <span className="flex shrink-0 translate-y-px items-center gap-1">
                  {line.compoundIds.map((id) => (
                    <SubstanceDot key={id} color={compoundColor(id)} />
                  ))}
                </span>
                <span className="min-w-0 break-words text-[14px] font-semibold">{line.name}</span>
                <span
                  className={clsx(
                    'shrink-0 text-[13px]',
                    line.readout.kind === 'finished' ? 'font-semibold text-warn' : 'text-muted',
                  )}
                >
                  · {text.phrase(line.readout)}
                </span>
              </div>
              {next && <div className="mt-0.5 text-[12px] text-muted">{next}</div>}
            </li>
          )
        })}
      </ul>
      {lines.length > MAX_LINES && (
        <p className="mt-2 text-[12px] text-muted">
          {t('cycles.summary.more', { count: lines.length - MAX_LINES })}
        </p>
      )}
    </>
  )

  return readOnly ? (
    <section className={clsx('card p-4', className)}>{body}</section>
  ) : (
    <Link to="/cycles" className={clsx('card block p-4 transition active:scale-[0.99]', className)}>
      {body}
    </Link>
  )
}
