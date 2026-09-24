import { ChevronLeft, Eye, EyeOff, FlaskConical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PatientScopeProvider, usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, Segmented, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import {
  useAddClinicalNote,
  useClinicalNotes,
  useDeleteClinicalNote,
  useProfile,
} from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'
import { HealthPage } from '@/features/health/HealthPage'
import { TodayPage } from '@/features/today/TodayPage'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

type Tab = 'today' | 'progress' | 'notes'

/**
 * Read-only view of someone who shares their control with me. It reuses the owner's
 * own screens inside a read-only scope, so both always see the same numbers.
 */
export function PatientDetailPage() {
  const { patientId = '' } = useParams()
  const { patient: me } = usePatientScope()
  const profile = useProfile(patientId)

  if (profile.isPending) {
    return (
      <div className="pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }
  if (!profile.data) return <Missing />

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
      <SharedProfile />
    </PatientScopeProvider>
  )
}

function Missing() {
  const { t } = useTranslation()
  return <EmptyState className="pt-20" title={t('errors.notFound')} />
}

function SharedProfile() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { patientId, patient } = usePatientScope()
  const [tab, setTab] = useState<Tab>('today')

  return (
    <div>
      <div className="safe-top sticky top-0 z-30 -mx-4 bg-canvas/80 px-4 pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => nav('/share')}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-panel text-ink-2"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="spec">{t('share.readOnly')}</div>
            <div className="truncate font-display text-[18px] font-bold">
              {patient?.display_name}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            leading={<FlaskConical className="size-4" />}
            onClick={() => nav(`/protocols/new?patient=${patientId}`)}
          >
            {t('share.propose')}
          </Button>
        </div>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          size="sm"
          className="mt-3"
          options={[
            { value: 'today', label: t('nav.today') },
            { value: 'progress', label: t('nav.progress') },
            { value: 'notes', label: t('clinic.notes') },
          ]}
        />
      </div>

      <div className="mt-2">
        {tab === 'today' && <TodayPage embedded />}
        {tab === 'progress' && <HealthPage embedded />}
        {tab === 'notes' && <NotesTab />}
      </div>
    </div>
  )
}

function NotesTab() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const { user } = useSession()
  const notes = useClinicalNotes(patientId)
  const add = useAddClinicalNote(patientId)
  const del = useDeleteClinicalNote(patientId)
  const [body, setBody] = useState('')
  const [visible, setVisible] = useState(true)

  async function save() {
    const text = body.trim()
    if (!text || !user) return
    try {
      await add.mutateAsync({
        patient_id: patientId,
        clinician_id: user.id,
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
    <div className="flex flex-col gap-4 pt-2">
      <Card title={t('clinic.addNote')}>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2"
          >
            {visible ? (
              <Eye className="size-4 text-signal" />
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
                  {n.clinician_id === user?.id && (
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
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
