import { CalendarRange } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, SectionTitle, Skeleton } from '@/components/ui/primitives'
import { useUndoOffer } from '@/features/protocols/useUndoOffer'
import { useNow } from '@/lib/useNow'
import { CycleCard } from './CycleCard'
import type { CycleView } from './model'
import { NewCycleSheet } from './NewCycleSheet'
import { PastCycleCard } from './PastCycleCard'
import { StepSheet } from './StepSheet'
import { useCyclesData } from './useCyclesData'

/**
 * Ciclos: a card per cycle with the ring, the phase it is in and its weeks one by one, the
 * decision when a step-up is close and what has happened in it; then the cycles behind and
 * the way to start the next one.
 */
export function CyclesPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const now = useNow()
  const data = useCyclesData(now)
  const { current, past } = data
  const undo = useUndoOffer()
  const [step, setStep] = useState<{ id: string; index: number } | null>(null)
  const [continuing, setContinuing] = useState<string | null>(null)

  const entries = [...current, ...past]
  const viewOf = (id: string | undefined) => entries.find((e) => e.view.row.id === id)?.view

  const stepView = viewOf(step?.id)
  const nextFrom = viewOf(continuing ?? undefined) ?? null
  const startNext = (view: CycleView) => setContinuing(view.row.id)

  return (
    <div className="pb-6">
      <PageHeader eyebrow={t('cycles.eyebrow')} title={t('cycles.title')} large back />

      {data.isPending ? (
        <div className="flex flex-col gap-4" aria-busy>
          <Card padded={false}>
            <Skeleton className="h-64 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-40 w-full" />
          </Card>
        </div>
      ) : data.isError ? (
        <Card>
          <EmptyState title={t('common.error')} />
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarRange className="size-7" />}
            title={t('cycles.empty.title')}
            description={t('cycles.empty.hint')}
            action={
              !data.readOnly && (
                <Button onClick={() => nav('/protocols/new')}>{t('cycles.empty.cta')}</Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <section>
            <SectionTitle>{t('cycles.sections.current')}</SectionTitle>
            {data.current.length === 0 ? (
              <p className="px-1 text-[13.5px] text-muted">{t('cycles.noneCurrent')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.current.map((entry) => (
                  <CycleCard
                    key={entry.view.row.id}
                    entry={entry}
                    now={now}
                    vials={data.vials}
                    statsState={data.statsState}
                    imperial={data.imperial}
                    canEdit={!data.readOnly}
                    onNewCycle={startNext}
                    onOpenStep={(view, index) => setStep({ id: view.row.id, index })}
                    offerUndo={undo.show}
                  />
                ))}
              </div>
            )}
          </section>

          {data.past.length > 0 && (
            <section>
              <SectionTitle>{t('cycles.sections.past')}</SectionTitle>
              <div className="flex flex-col gap-3">
                {data.past.map((entry) => (
                  <PastCycleCard
                    key={entry.view.row.id}
                    entry={entry}
                    now={now}
                    vials={data.vials}
                    statsState={data.statsState}
                    imperial={data.imperial}
                    onNewCycle={startNext}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {step && stepView && (
        <StepSheet
          key={`${step.id}:${step.index}`}
          view={stepView}
          stepIndex={step.index}
          onClose={() => setStep(null)}
          onStep={(index) => setStep({ id: stepView.row.id, index })}
          now={now}
          vials={data.vials}
          input={data.inputOf(stepView)}
          canEdit={!data.readOnly}
        />
      )}
      <NewCycleSheet
        view={nextFrom}
        open={nextFrom !== null}
        onClose={() => setContinuing(null)}
        vials={data.vials}
        now={now}
      />
    </div>
  )
}
