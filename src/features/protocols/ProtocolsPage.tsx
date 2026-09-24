import { Bookmark, FlaskConical, Pause, Play, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, SectionTitle, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { ProtocolRow, ProtocolStatus } from '@/data/database.types'
import {
  useDeleteSavedProtocol,
  useProtocols,
  useSavedProtocols,
  useSetProtocolStatus,
} from '@/data/hooks'
import { parseComponents, parseSteps, protocolCompoundIds, toProtocolLike } from '@/data/mappers'
import { titrationStatus } from '@/domain/dosing/schedule'
import { useSession } from '@/features/auth/SessionProvider'
import { fmtDose } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useScheduleLabel } from './scheduleLabel'

const STATUS_TONE: Record<ProtocolStatus, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  paused: 'warn',
  completed: 'neutral',
  archived: 'neutral',
}

export function ProtocolsPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { user } = useSession()
  const { toast } = useToast()
  const { patientId, readOnly, canPrescribe } = usePatientScope()
  const protocols = useProtocols(patientId)
  const saved = useSavedProtocols(user?.id)
  const delSaved = useDeleteSavedProtocol(user?.id ?? '')
  const scheduleLabel = useScheduleLabel()
  const canEdit = !readOnly || canPrescribe

  const list = protocols.data ?? []
  const current = list.filter((p) => p.status === 'active' || p.status === 'paused')
  const past = list.filter((p) => p.status === 'completed' || p.status === 'archived')

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow={t('protocols.eyebrow')}
        title={t('protocols.title')}
        large
        back="/more"
        action={
          canEdit && (
            <Button
              size="sm"
              leading={<Plus className="size-4" />}
              onClick={() => nav('/protocols/new')}
            >
              {t('common.add')}
            </Button>
          )
        }
      />

      {protocols.isPending ? (
        <Card>
          <Skeleton className="h-20 w-full" />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FlaskConical className="size-7" />}
            title={t('protocols.empty')}
            description={t('protocols.emptyHint')}
            action={
              canEdit && <Button onClick={() => nav('/protocols/new')}>{t('protocols.new')}</Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {current.map((p) => (
            <ProtocolCard key={p.id} p={p} canEdit={canEdit} scheduleLabel={scheduleLabel} />
          ))}
          {past.length > 0 && (
            <>
              <SectionTitle>{t('protocols.history')}</SectionTitle>
              {past.map((p) => (
                <ProtocolCard key={p.id} p={p} canEdit={canEdit} scheduleLabel={scheduleLabel} />
              ))}
            </>
          )}
        </div>
      )}

      {!readOnly && (saved.data ?? []).length > 0 && (
        <section className="mt-6">
          <SectionTitle index="◆">{t('protocols.savedTitle')}</SectionTitle>
          <Card padded={false} className="px-4">
            <ul className="divide-y divide-line">
              {(saved.data ?? []).map((s) => {
                const mine = s.owner_id === user?.id
                const ids = [
                  s.compound_id,
                  ...parseComponents(s.components).map((c) => c.compoundId),
                ]
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <Bookmark className="size-4 shrink-0 text-muted" />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => nav(`/protocols/new?saved=${s.id}`)}
                    >
                      <div className="flex items-center gap-1.5">
                        {ids.map((id) => (
                          <SubstanceDot key={id} color={compoundColor(id)} />
                        ))}
                        <span className="truncate text-[14.5px] font-semibold">{s.name}</span>
                      </div>
                      <div className="readout truncate text-[12px] text-muted">
                        {scheduleLabel(parseSteps(s.steps), s.times)}
                        {!mine && ` · ${t('protocols.shared')}`}
                      </div>
                    </button>
                    {mine && (
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={async () => {
                          if (!window.confirm(t('common.deleteConfirm'))) return
                          try {
                            await delSaved.mutateAsync(s.id)
                          } catch {
                            toast(t('common.error'), 'error')
                          }
                        }}
                        className="grid size-8 place-items-center rounded-full text-muted hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      )}
    </div>
  )
}

function ProtocolCard({
  p,
  canEdit,
  scheduleLabel,
}: {
  p: ProtocolRow
  canEdit: boolean
  scheduleLabel: ReturnType<typeof useScheduleLabel>
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  const { toast } = useToast()
  const { patientId } = usePatientScope()
  const setStatus = useSetProtocolStatus(patientId)
  const pl = toProtocolLike(p)
  const tit = titrationStatus(pl, new Date())
  const ids = protocolCompoundIds(p)
  const primaryColor = compoundColor(p.compound_id)

  async function change(status: ProtocolStatus) {
    try {
      await setStatus.mutateAsync({ id: p.id, status })
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <Card
      padded={false}
      className="overflow-hidden"
      style={{ borderColor: `color-mix(in oklab, ${primaryColor} 28%, var(--line))` }}
    >
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => nav(`/protocols/${p.id}`)}
        className="block w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {ids.map((id) => (
                <SubstanceDot key={id} color={compoundColor(id)} />
              ))}
              <span className="truncate font-display text-[17px] font-semibold">{p.name}</span>
            </div>
            <div className="readout mt-1 text-[12.5px] text-muted">
              {scheduleLabel(pl.steps, pl.times)}
            </div>
          </div>
          <Badge tone={STATUS_TONE[p.status]}>{t(`protocols.statuses.${p.status}`)}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {[
            { compoundId: p.compound_id, doseMg: tit?.doseMg ?? pl.steps[0]?.doseMg ?? 0 },
            ...(pl.components ?? []),
          ].map((d) => (
            <span key={d.compoundId} className="spec">
              {compoundById(d.compoundId)?.names.generic}{' '}
              <span className="readout text-ink">
                {tit?.isPaused && d.compoundId === p.compound_id
                  ? t('protocols.pause')
                  : fmtDose(d.doseMg, compoundById(d.compoundId)?.defaultUnit ?? 'mg', locale)}
              </span>
            </span>
          ))}
          {tit && tit.totalSteps > 1 && (
            <span className="spec">
              {t('protocols.step')}{' '}
              <span className="readout text-ink">
                {tit.stepIndex + 1}/{tit.totalSteps}
              </span>
            </span>
          )}
        </div>
      </button>
      {canEdit && (
        <div className="flex gap-2 border-t border-line px-4 py-2.5">
          {p.status === 'active' ? (
            <Button
              size="sm"
              variant="ghost"
              leading={<Pause className="size-4" />}
              onClick={() => void change('paused')}
            >
              {t('protocols.pause')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="soft"
              leading={<Play className="size-4" />}
              onClick={() => void change('active')}
            >
              {t('protocols.activate')}
            </Button>
          )}
          {p.status !== 'archived' && (
            <Button size="sm" variant="ghost" onClick={() => void change('archived')}>
              {t('protocols.archive')}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
