import { FlaskConical, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Row, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById, compoundName } from '@/content/compounds'
import type { ProtocolStatus } from '@/data/database.types'
import { useProtocols, useSetProtocolStatus } from '@/data/hooks'
import { parseSteps } from '@/data/mappers'
import { fmtDate, fmtDose } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

const STATUS_TONE: Record<ProtocolStatus, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  paused: 'warn',
  completed: 'neutral',
  archived: 'neutral',
}

export function ProtocolsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  const { toast } = useToast()
  const { patientId, readOnly, canPrescribe } = usePatientScope()
  const protocols = useProtocols(patientId)
  const setStatus = useSetProtocolStatus(patientId)
  const canEdit = !readOnly || canPrescribe

  const list = protocols.data ?? []

  return (
    <div>
      <PageHeader
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
          <Skeleton className="h-16 w-full" />
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
          {list.map((p) => {
            const steps = parseSteps(p.steps)
            const unit = compoundById(p.compound_id)?.defaultUnit ?? 'mg'
            const first = steps[0]
            const last = steps[steps.length - 1]
            return (
              <Card key={p.id} padded={false} className="px-4 py-1">
                <Row
                  onClick={canEdit ? () => nav(`/protocols/${p.id}`) : undefined}
                  title={
                    <span className="flex items-center gap-2">
                      {p.name}
                      <Badge tone={STATUS_TONE[p.status]}>
                        {t(`protocols.statuses.${p.status}`)}
                      </Badge>
                    </span>
                  }
                  subtitle={
                    <>
                      {compoundName(p.compound_id)} ·{' '}
                      {first && last
                        ? `${fmtDose(first.doseMg, unit, locale)} → ${fmtDose(last.doseMg, unit, locale)}`
                        : ''}{' '}
                      ·{' '}
                      {t('protocols.summary', {
                        steps: steps.length,
                        date: fmtDate(new Date(p.start_date), locale),
                      })}
                    </>
                  }
                />
                {canEdit && (
                  <div className="flex gap-2 pb-3 pt-1">
                    {p.status !== 'active' && (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={async () => {
                          try {
                            await setStatus.mutateAsync({ id: p.id, status: 'active' })
                            toast(t('common.saved'), 'success')
                          } catch {
                            toast(t('common.error'), 'error')
                          }
                        }}
                      >
                        {t('protocols.activate')}
                      </Button>
                    )}
                    {p.status === 'active' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setStatus.mutate({ id: p.id, status: 'paused' })}
                      >
                        {t('protocols.pause')}
                      </Button>
                    )}
                    {p.status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatus.mutate({ id: p.id, status: 'archived' })}
                      >
                        {t('protocols.archive')}
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
