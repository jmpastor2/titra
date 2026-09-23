import { subDays } from 'date-fns'
import { Activity, FlaskConical, Scale, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Segmented, Skeleton, Stat } from '@/components/ui/primitives'
import { useClinicalNotes, useMeasurements, useSymptoms } from '@/data/hooks'
import { compositionTrend } from '@/domain/lean/leanMass'
import { LogDoseSheet } from '@/features/doses/LogDoseSheet'
import { ExposureCard } from '@/features/exposure/ExposureCard'
import { useExposure } from '@/features/exposure/useExposure'
import { LogMeasurementSheet } from '@/features/health/LogMeasurementSheet'
import { LogSymptomSheet } from '@/features/symptoms/LogSymptomSheet'
import { fmtDate, fmtNumber, fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

export function DashboardPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const nav = useNavigate()
  const now = useMemo(() => new Date(), [])
  const exposure = useExposure(patientId, now)
  const symptoms = useSymptoms(patientId, 60)
  const measurements = useMeasurements(patientId, 120)
  const notes = useClinicalNotes(patientId)

  const [selected, setSelected] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'dose' | 'symptom' | 'weight' | null>(null)

  const current = exposure.items.find((x) => x.compoundId === selected) ?? exposure.primary
  const withProtocol = exposure.items.filter((x) => x.protocol)

  const weightTrend = useMemo(() => {
    const pts = (measurements.data ?? [])
      .filter((m) => m.kind === 'weight')
      .map((m) => ({ at: new Date(m.measured_at), kg: Number(m.value) }))
    return { latest: pts[0] ?? null, trend: compositionTrend(pts, 30) }
  }, [measurements.data])

  const lastSymptom = symptoms.data?.[0]
  const recentSymptoms = useMemo(
    () => (symptoms.data ?? []).filter((s) => new Date(s.occurred_at) > subDays(now, 60)),
    [symptoms.data, now],
  )
  const visibleNotes = (notes.data ?? []).filter((n) => n.visible_to_patient)

  return (
    <div className="flex flex-col gap-4 pt-[max(env(safe-area-inset-top),16px)]">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted">
            {fmtDate(now, locale, 'EEEE, d MMMM')}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight">
            {t('dashboard.greeting', { name: patient?.display_name?.split(' ')[0] ?? '' })}
          </h1>
        </div>
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          className="size-10 rounded-xl"
        />
      </header>

      {exposure.isPending ? (
        <Card>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-[210px] w-full" />
        </Card>
      ) : exposure.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FlaskConical className="size-7" />}
            title={t('dashboard.noProtocol')}
            description={t('dashboard.noProtocolHint')}
            action={
              !readOnly && (
                <Button onClick={() => nav('/protocols/new')}>
                  {t('dashboard.createProtocol')}
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          {exposure.items.length > 1 && (
            <Segmented
              value={current?.compoundId ?? ''}
              onChange={setSelected}
              size="sm"
              options={exposure.items.map((x) => ({
                value: x.compoundId,
                label: x.compound?.names.generic ?? x.compoundId,
              }))}
            />
          )}
          {current && (
            <ExposureCard
              x={current}
              symptoms={recentSymptoms}
              now={now}
              readOnly={readOnly}
              onLogDose={() => setSheet('dose')}
            />
          )}
          {withProtocol.length === 0 && !readOnly && (
            <Card tone="warn" className="text-[13.5px]">
              {t('dashboard.noProtocolHint')}{' '}
              <Link to="/protocols/new" className="font-semibold text-brand-strong underline">
                {t('dashboard.createProtocol')}
              </Link>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer"
          onClick={() => nav('/health')}
          title={t('dashboard.weight')}
          action={<Scale className="size-4 text-muted" />}
        >
          {weightTrend.latest ? (
            <Stat
              label=""
              value={fmtNumber(weightTrend.latest.kg, locale, 1)}
              unit="kg"
              hint={
                weightTrend.trend
                  ? t('dashboard.weightDelta', {
                      delta: `${weightTrend.trend.deltaKg > 0 ? '+' : ''}${fmtNumber(weightTrend.trend.deltaKg, locale, 1)} kg`,
                      days: Math.round(weightTrend.trend.days),
                    })
                  : fmtRelativeDay(weightTrend.latest.at, locale)
              }
            />
          ) : (
            <p className="text-[13px] text-muted">{t('health.emptyHint')}</p>
          )}
        </Card>
        <Card
          className="cursor-pointer"
          onClick={() => nav('/health?tab=symptoms')}
          title={t('dashboard.lastSymptom')}
          action={<Activity className="size-4 text-muted" />}
        >
          {lastSymptom ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">
                  {t(`symptoms.kinds.${lastSymptom.kind}`)}
                </span>
                <Badge
                  tone={
                    lastSymptom.severity >= 7 ? 'danger' : lastSymptom.severity >= 4 ? 'warn' : 'ok'
                  }
                >
                  {lastSymptom.severity}/10
                </Badge>
              </div>
              <div className="mt-1 text-[12.5px] text-muted">
                {fmtRelativeDay(new Date(lastSymptom.occurred_at), locale)}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-muted">{t('symptoms.empty')}</p>
          )}
        </Card>
      </div>

      {!readOnly && (
        <div>
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted">
            {t('dashboard.quickActions')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <QuickAction
              icon={<Activity className="size-5" />}
              label={t('dashboard.logSymptom')}
              onClick={() => setSheet('symptom')}
            />
            <QuickAction
              icon={<Scale className="size-5" />}
              label={t('dashboard.logWeight')}
              onClick={() => setSheet('weight')}
            />
            <QuickAction
              icon={<Sparkles className="size-5" />}
              label={t('dashboard.whatIf')}
              onClick={() => nav('/simulator')}
            />
          </div>
        </div>
      )}

      {visibleNotes.length > 0 && (
        <Card title={t('dashboard.clinicianNotes')} tone="accent">
          <ul className="flex flex-col gap-3">
            {visibleNotes.slice(0, 3).map((n) => (
              <li key={n.id} className="text-[13.5px]">
                <div className="text-[11.5px] text-muted">
                  {fmtDate(new Date(n.created_at), locale)}
                </div>
                <p className="whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="px-2 pb-2 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>

      <LogDoseSheet
        open={sheet === 'dose'}
        onClose={() => setSheet(null)}
        defaultCompoundId={current?.compoundId}
        defaultProtocolId={current?.protocol?.id ?? null}
        defaultDoseMg={current?.next?.doseMg}
      />
      <LogSymptomSheet open={sheet === 'symptom'} onClose={() => setSheet(null)} />
      <LogMeasurementSheet
        open={sheet === 'weight'}
        onClose={() => setSheet(null)}
        defaultKind="weight"
      />
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex flex-col items-center gap-1.5 px-2 py-3 text-[12.5px] font-semibold text-ink-2 transition active:scale-[0.98]"
    >
      <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand-strong">
        {icon}
      </span>
      {label}
    </button>
  )
}
