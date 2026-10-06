import { Bookmark, FlaskConical, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, SectionTitle, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundColor } from '@/content/substanceColor'
import { useDeleteSavedProtocol, useInventory, useProtocols, useSavedProtocols } from '@/data/hooks'
import { parseComponents, parseSteps } from '@/data/mappers'
import { useSession } from '@/features/auth/SessionProvider'
import { useNow } from '@/lib/useNow'
import { ProtocolCard } from './ProtocolCard'
import { useScheduleLabel } from './scheduleLabel'
import { useUndoOffer } from './useUndoOffer'

export function ProtocolsPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { user } = useSession()
  const { toast } = useToast()
  const { patientId, readOnly, canPrescribe } = usePatientScope()
  const protocols = useProtocols(patientId)
  const inventory = useInventory(patientId)
  const saved = useSavedProtocols(user?.id)
  const delSaved = useDeleteSavedProtocol(user?.id ?? '')
  const scheduleLabel = useScheduleLabel()
  const now = useNow()
  const undo = useUndoOffer()
  const canEdit = !readOnly || canPrescribe
  const vials = useMemo(() => inventory.data ?? [], [inventory.data])

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
            <ProtocolCard
              key={p.id}
              p={p}
              vials={vials}
              now={now}
              canEdit={canEdit}
              offerUndo={undo.show}
            />
          ))}
          {past.length > 0 && (
            <>
              <SectionTitle>{t('protocols.history')}</SectionTitle>
              {past.map((p) => (
                <ProtocolCard
                  key={p.id}
                  p={p}
                  vials={vials}
                  now={now}
                  canEdit={canEdit}
                  offerUndo={undo.show}
                />
              ))}
            </>
          )}
        </div>
      )}

      {!readOnly && (saved.data ?? []).length > 0 && (
        <section className="mt-6">
          <SectionTitle>{t('protocols.savedTitle')}</SectionTitle>
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
                      className="min-h-11 min-w-0 flex-1 text-left"
                      onClick={() => nav(`/protocols/new?saved=${s.id}`)}
                    >
                      <div className="flex items-center gap-1.5">
                        {ids.map((id) => (
                          <SubstanceDot key={id} color={compoundColor(id)} />
                        ))}
                        <span className="break-words text-[14.5px] font-semibold">{s.name}</span>
                      </div>
                      <div className="readout text-[12px] text-muted">
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
                        className="grid size-11 place-items-center rounded-full text-muted hover:text-danger"
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
