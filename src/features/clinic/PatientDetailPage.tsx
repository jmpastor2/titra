import { subDays } from 'date-fns'
import { Eye, EyeOff, Plus, Trash2, UserMinus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PatientScopeProvider, usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Row, Segmented, Skeleton, Stat } from '@/components/ui/primitives'
import { Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import {
  useAddClinicalNote,
  useCareLinks,
  useClinicalNotes,
  useDeleteClinicalNote,
  useMeasurements,
  useProfile,
  useRevokeLink,
  useSymptoms,
} from '@/data/hooks'
import { compositionTrend } from '@/domain/lean/leanMass'
import { useSession } from '@/features/auth/SessionProvider'
import { ExposureCard } from '@/features/exposure/ExposureCard'
import { useExposure } from '@/features/exposure/useExposure'
import { TrendChart } from '@/features/exposure/TrendChart'
import { fmtDate, fmtDateTime, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

type Tab = 'overview' | 'doses' | 'symptoms' | 'health' | 'notes'

export function PatientDetailPage() {
  const { patientId = '' } = useParams()
  const { patient: me } = usePatientScope()
  const profile = useProfile(patientId)

  if (profile.isPending) {
    return (
      <div className="pt-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }
  if (!profile.data) return <PatientMissing />

  return (
    <PatientScopeProvider
      value={{
        patientId,
        patient: profile.data,
        isSelf: patientId === me?.id,
        readOnly: true,
        canPrescribe: true,
      }}
    >
      <PatientDetail />
    </PatientScopeProvider>
  )
}

function PatientMissing() {
  const { t } = useTranslation()
  return (
    <div className="pt-6">
      <PageHeader title={t('errors.notFound')} back />
    </div>
  )
}

function PatientDetail() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  const { toast } = useToast()
  const { patientId, patient } = usePatientScope()
  const [tab, setTab] = useState<Tab>('overview')
  const now = useMemo(() => new Date(), [])

  const exposure = useExposure(patientId, now)
  const symptoms = useSymptoms(patientId, 90)
  const measurements = useMeasurements(patientId, 180)
  const links = useCareLinks(patient?.id)
  const revoke = useRevokeLink(patientId)

  const weightPoints = useMemo(
    () =>
      (measurements.data ?? [])
        .filter((m) => m.kind === 'weight')
        .map((m) => ({ at: new Date(m.measured_at), kg: Number(m.value) })),
    [measurements.data],
  )
  const trend = useMemo(() => compositionTrend(weightPoints, 90), [weightPoints])
  const recentSymptoms = useMemo(
    () => (symptoms.data ?? []).filter((s) => new Date(s.occurred_at) > subDays(now, 90)),
    [symptoms.data, now],
  )

  return (
    <div>
      <PageHeader
        title={patient?.display_name ?? ''}
        subtitle={t('clinic.readOnly')}
        back="/"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => nav('/protocols/new?patient=' + patientId)}
          >
            {t('clinic.prescribe')}
          </Button>
        }
      />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        size="sm"
        className="mb-3"
        options={[
          { value: 'overview', label: t('clinic.overview') },
          { value: 'symptoms', label: t('clinic.symptoms') },
          { value: 'health', label: t('clinic.health') },
          { value: 'notes', label: t('clinic.notes') },
        ]}
      />

      {tab === 'overview' && (
        <div className="flex flex-col gap-4">
          {exposure.isPending ? (
            <Card>
              <Skeleton className="h-52 w-full" />
            </Card>
          ) : exposure.items.length === 0 ? (
            <Card>
              <EmptyState title={t('doses.empty')} description={t('doses.emptyHint')} />
            </Card>
          ) : (
            exposure.items.map((x) => (
              <ExposureCard key={x.compoundId} x={x} symptoms={recentSymptoms} now={now} readOnly />
            ))
          )}
        </div>
      )}

      {tab === 'symptoms' && (
        <Card padded={false} className="px-4">
          {recentSymptoms.length === 0 ? (
            <EmptyState title={t('symptoms.empty')} />
          ) : (
            <ul className="divide-y divide-line">
              {recentSymptoms.map((s) => (
                <li key={s.id}>
                  <Row
                    title={t(`symptoms.kinds.${s.kind}`)}
                    subtitle={
                      <>
                        {fmtDateTime(new Date(s.occurred_at), locale)}
                        {s.notes ? ` · ${s.notes}` : ''}
                      </>
                    }
                    trailing={
                      <Badge tone={s.severity >= 7 ? 'danger' : s.severity >= 4 ? 'warn' : 'ok'}>
                        {s.severity}/10
                      </Badge>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'health' && (
        <div className="flex flex-col gap-4">
          <Card title={t('health.kinds.weight')}>
            {weightPoints.length >= 2 ? (
              <>
                <div className="mb-2 flex gap-6">
                  <Stat
                    label={t('health.kinds.weight')}
                    value={fmtNumber(weightPoints[0]!.kg, locale, 1)}
                    unit="kg"
                  />
                  {trend && (
                    <Stat
                      label={t('health.trend')}
                      value={`${trend.deltaKg > 0 ? '+' : ''}${fmtNumber(trend.deltaKg, locale, 1)}`}
                      unit="kg"
                      tone={trend.deltaKg < 0 ? 'brand' : undefined}
                      hint={`${fmtNumber(trend.kgPerWeek, locale, 2)} kg/${t('common.week').toLowerCase()}`}
                    />
                  )}
                </div>
                <TrendChart
                  points={weightPoints.map((p) => ({ at: p.at, value: p.kg }))}
                  unit="kg"
                  target={patient?.goal_weight_kg ?? undefined}
                />
              </>
            ) : (
              <p className="text-[13px] text-muted">{t('lean.needTwoWeights')}</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'notes' && <NotesTab />}

      <div className="mt-6 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          leading={<UserMinus className="size-4" />}
          onClick={async () => {
            if (!window.confirm(t('clinic.unlinkConfirm'))) return
            const link = (links.data ?? []).find((l) => l.patient_id === patientId)
            if (!link) return
            try {
              await revoke.mutateAsync(link.id)
              toast(t('common.saved'), 'success')
              nav('/')
            } catch {
              toast(t('common.error'), 'error')
            }
          }}
        >
          {t('clinic.unlink')}
        </Button>
      </div>
    </div>
  )
}

function NotesTab() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const notes = useClinicalNotes(patientId)
  const add = useAddClinicalNote(patientId)
  const del = useDeleteClinicalNote(patientId)
  const { user } = useSession()
  const [body, setBody] = useState('')
  const [visible, setVisible] = useState(true)
  const clinicianId = user?.id ?? ''

  async function save() {
    const text = body.trim()
    if (!text) return
    try {
      await add.mutateAsync({
        patient_id: patientId,
        clinician_id: clinicianId,
        body: text,
        visible_to_patient: visible,
      })
      setBody('')
      toast(t('common.saved'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title={t('clinic.addNote')}>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2"
          >
            {visible ? (
              <Eye className="size-4 text-brand-strong" />
            ) : (
              <EyeOff className="size-4 text-muted" />
            )}
            {visible ? t('clinic.noteVisible') : t('clinic.noteHidden')}
          </button>
          <Button
            size="sm"
            leading={<Plus className="size-4" />}
            loading={add.isPending}
            onClick={save}
          >
            {t('common.save')}
          </Button>
        </div>
      </Card>

      <Card padded={false} className="px-4">
        {(notes.data ?? []).length === 0 ? (
          <EmptyState title={t('clinic.notesEmpty')} />
        ) : (
          <ul className="divide-y divide-line">
            {(notes.data ?? []).map((n) => (
              <li key={n.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11.5px] text-muted">
                      {fmtDate(new Date(n.created_at), locale)}
                      <Badge tone={n.visible_to_patient ? 'brand' : 'neutral'}>
                        {n.visible_to_patient ? t('clinic.noteVisible') : t('clinic.noteHidden')}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13.5px]">{n.body}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={async () => {
                      if (!window.confirm(t('common.deleteConfirm'))) return
                      await del.mutateAsync(n.id)
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
