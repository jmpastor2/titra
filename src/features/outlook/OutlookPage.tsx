/**
 * "Futuro": what each substance in the active protocols could mean over the next
 * 3 / 6 / 12 months, told honestly. Trial-backed compounds show the band a published
 * trial observed for the arms that bracket the user's dose; everything else says there
 * are no human outcome data. The user's own weight trend is drawn forward next to the
 * trial band, always flagged as an extrapolation, and one list says what to measure.
 */
import { ChevronRight, Info, Telescope } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, SectionTitle, Skeleton } from '@/components/ui/primitives'
import type { MeasureItem } from '@/content/outlook'
import type { MeasurementKind } from '@/data/database.types'
import { useMeasurements, useProtocols } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { AddLabSheet } from '@/features/health/AddLabSheet'
import { LogMeasurementSheet } from '@/features/health/LogMeasurementSheet'
import { useNow } from '@/lib/useNow'
import { personalTrend, weightPoints, type Horizon } from './outlook'
import { buildModel, mergeMeasure, measureStatus } from './outlookModel'
import { MeasureSection } from './MeasureSection'
import { NoDataSection, type NoDataEntry } from './NoDataSection'
import { Headline, HeadlineTrial } from './OutlookHero'
import { TrialCard } from './TrialCard'
import { useFormat } from './outlookFormat'

type SheetState =
  { kind: 'measure'; measure: MeasurementKind } | { kind: 'checkin' } | { kind: 'lab' } | null

export function OutlookPage() {
  const f = useFormat()
  const { t } = f
  const navigate = useNavigate()
  const { patientId, readOnly } = usePatientScope()
  const protocols = useProtocols(patientId)
  const measurements = useMeasurements(patientId, 730)
  const now = useNow()
  const [horizon, setHorizon] = useState<Horizon>(6)
  const [sheet, setSheet] = useState<SheetState>(null)

  const model = useMemo(
    () => buildModel(protocols.data ?? [], now, horizon),
    [protocols.data, now, horizon],
  )
  const rows = useMemo(() => measurements.data ?? [], [measurements.data])
  const weights = useMemo(() => weightPoints(rows), [rows])

  const pick = (m: MeasureItem) => {
    if (readOnly) return
    if (m.target.type === 'measurement') setSheet({ kind: 'measure', measure: m.target.kind })
    else if (m.target.type === 'checkin') setSheet({ kind: 'checkin' })
    else if (m.target.type === 'lab') setSheet({ kind: 'lab' })
  }
  const logWeight = () => setSheet({ kind: 'measure', measure: 'weight' })

  // The person on the scale is measured from the first trial's start, or the cycle's without one.
  const first = model.trialItems[0]
  const since = first?.since ?? model.cycle
  const headlineTrend = useMemo(
    () => (since ? personalTrend(weights, since, now) : null),
    [weights, since, now],
  )

  // What no trial measured, once per compound, and the things worth measuring, once each.
  const noData = useMemo<NoDataEntry[]>(() => {
    const entries = model.items.flatMap((i) => i.others).filter((o) => o.outlook?.kind !== 'trial')
    return entries.filter((o, i) => entries.findIndex((e) => e.compoundId === o.compoundId) === i)
  }, [model.items])
  const measure = useMemo(
    () => (model.cycle ? measureStatus(mergeMeasure(model.items), rows, model.cycle) : []),
    [model.items, model.cycle, rows],
  )

  const loading = protocols.isPending || measurements.isPending

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader eyebrow={t('outlook.eyebrow')} title={t('outlook.title')} back="/more" />

      {loading ? (
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : model.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Telescope className="size-6" />}
            title={t('outlook.empty.title')}
            description={t('outlook.empty.body')}
            action={
              !readOnly && (
                <Button size="sm" onClick={() => navigate('/protocols/new')}>
                  {t('outlook.empty.action')}
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Headline
            f={f}
            horizon={horizon}
            onHorizon={setHorizon}
            now={now}
            trials={model.trialItems}
            trend={headlineTrend}
            readOnly={readOnly}
            onLogWeight={logWeight}
          />

          {model.trialItems.map((item) => (
            <TrialCard
              key={item.row.id}
              f={f}
              item={item}
              horizon={horizon}
              now={now}
              weights={weights}
              readOnly={readOnly}
              onLogWeight={logWeight}
            />
          ))}

          {measure.length > 0 && model.cycle && (
            <section>
              <SectionTitle>{t('outlook.measure.title')}</SectionTitle>
              <MeasureSection
                f={f}
                status={measure}
                since={model.cycle}
                readOnly={readOnly}
                onPick={pick}
              />
            </section>
          )}

          {noData.length > 0 && (
            <section>
              <SectionTitle>{t('outlook.section.noData')}</SectionTitle>
              <NoDataSection f={f} entries={noData} />
            </section>
          )}
        </>
      )}

      {model.items.length > 0 && (
        <p className="flex gap-2 px-1 text-[12px] leading-relaxed text-muted">
          <Info className="mt-[3px] size-3.5 shrink-0" aria-hidden />
          <span>{t('outlook.disclaimer.body')}</span>
        </p>
      )}

      <LogMeasurementSheet
        key={sheet?.kind === 'measure' ? sheet.measure : 'closed'}
        open={sheet?.kind === 'measure'}
        onClose={() => setSheet(null)}
        defaultKind={sheet?.kind === 'measure' ? sheet.measure : 'weight'}
      />
      <CheckInSheet open={sheet?.kind === 'checkin'} onClose={() => setSheet(null)} />
      <AddLabSheet open={sheet?.kind === 'lab'} onClose={() => setSheet(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ compact card */

/**
 * Compact summary for Progress: the trial range at 6 months on its scale, with the person on it,
 * and a link to the screen. The weights come from the same request the screen around it makes.
 */
export function OutlookCard({ horizon = 6 }: { horizon?: Horizon }) {
  const f = useFormat()
  const { t } = f
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const measurements = useMeasurements(patientId, 365)
  const now = useNow()
  const model = useMemo(
    () => buildModel(protocols.data ?? [], now, horizon),
    [protocols.data, now, horizon],
  )
  const weights = useMemo(() => weightPoints(measurements.data ?? []), [measurements.data])
  if (protocols.isPending || model.items.length === 0) return null
  const first = model.trialItems[0]
  const trend = first ? personalTrend(weights, first.since, now) : null
  return (
    <Link
      to="/outlook"
      className="card fade-up block p-4 outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="spec">
          {t('outlook.title')} · {t('outlook.headline.in', { n: horizon })}
        </span>
        <ChevronRight className="size-4 text-muted" aria-hidden />
      </div>
      <div className="mt-2">
        {first ? (
          <HeadlineTrial f={f} item={first} compactScale youPct={trend?.changePct ?? null} />
        ) : (
          <p className="text-[13px] leading-snug text-ink-2">
            {t('outlook.card.noData', {
              names: model.otherItems.map((i) => i.title).join(', '),
            })}
          </p>
        )}
      </div>
    </Link>
  )
}
