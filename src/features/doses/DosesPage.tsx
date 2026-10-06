import { addDays } from 'date-fns'
import { Plus, Syringe } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FloatingAction } from '@/components/ui/FloatingAction'
import { EmptyState, Skeleton } from '@/components/ui/primitives'
import { useDoses, useInventory, useProtocols } from '@/data/hooks'
import { fmtRelativeDay } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { AdministrationRow } from './AdministrationRow'
import { AssignSlotSheet } from './AssignSlotSheet'
import { DeleteDoseSheet } from './DeleteDoseSheet'
import { DoseActionsSheet } from './DoseActionsSheet'
import { EditDoseSheet } from './EditDoseSheet'
import { LogDoseSheet } from './LogDoseSheet'
import { LogFilter, type LogCombo } from './LogFilter'
import { LogSummary } from './LogSummary'
import { WeekCard } from './WeekCard'
import {
  comboKey,
  groupAdministrations,
  groupByDay,
  summariseDay,
  type Administration,
} from './administrations'
import { fitOf, type Fit } from './delta'
import { findExtras, type ExtraDose } from './extras'
import { logKpis } from './logKpis'
import { punctuality } from './punctuality'
import { useAssignDose } from './useAssignDose'
import { doseCells } from './week'

/** Days of the log shown at first, and added with each "show more". */
const DAYS_PER_PAGE = 14

type Overlay = { kind: 'actions' | 'edit' | 'delete' | 'assign'; key: string }

export function DosesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  // Refreshed every few minutes and when the app comes back to the front.
  const now = useNow(5 * 60_000)
  const doses = useDoses(patientId, 365)
  const protocols = useProtocols(patientId)
  const inventory = useInventory(patientId, true)
  const assign = useAssignDose(patientId)

  const doseRows = useMemo(() => doses.data ?? [], [doses.data])
  const protocolRows = useMemo(() => protocols.data ?? [], [protocols.data])
  const vialById = useMemo(
    () => new Map((inventory.data ?? []).map((v) => [v.id, v])),
    [inventory.data],
  )

  const admins = useMemo(() => groupAdministrations(doseRows), [doseRows])
  const adminByKey = useMemo(() => new Map(admins.map((a) => [a.key, a])), [admins])
  // How each dose sits against the plan: the same matching as the week card and Hoy.
  const cells = useMemo(
    () => doseCells(protocolRows, doseRows, addDays(now, -365), now),
    [protocolRows, doseRows, now],
  )
  const extras = useMemo(() => findExtras(cells, doseRows, now), [cells, doseRows, now])
  const fits = useMemo(
    () => new Map<string, Fit>([...cells].map(([key, cell]) => [key, fitOf(cell)])),
    [cells],
  )

  const kpis = useMemo(() => logKpis(protocolRows, doseRows, now), [protocolRows, doseRows, now])
  const punctual = useMemo(() => punctuality(cells.values(), now), [cells, now])

  const [filter, setFilter] = useState('all')
  const [planOpen, setPlanOpen] = useState(false)
  const [shownDays, setShownDays] = useState(DAYS_PER_PAGE)
  const [logging, setLogging] = useState<{ protocolId?: string; plannedAt?: Date } | null>(null)
  const [overlay, setOverlay] = useState<Overlay | null>(null)

  // One filter per thing you inject: a blend or stack is one chip, not one per compound.
  const combos = useMemo<LogCombo[]>(() => {
    const seen = new Map<string, string[]>()
    for (const a of admins)
      seen.set(
        comboKey(a),
        a.rows.map((r) => r.compound_id),
      )
    return [...seen].map(([key, compoundIds]) => ({ key, compoundIds }))
  }, [admins])

  const filtered = useMemo(
    () => (filter === 'all' ? admins : admins.filter((a) => comboKey(a) === filter)),
    [admins, filter],
  )
  const days = useMemo(() => groupByDay(filtered), [filtered])
  const visibleDays = days.slice(0, shownDays)

  const openActions = useCallback((key: string) => setOverlay({ kind: 'actions', key }), [])
  const assignExtra = useCallback(
    async (extra: ExtraDose) => {
      const admin = adminByKey.get(extra.key)
      if (admin && extra.suggested) await assign(admin.rows, extra.suggested, extra.protocol.id)
    },
    [adminByKey, assign],
  )

  const target = overlay ? (adminByKey.get(overlay.key) ?? null) : null
  const closeOverlay = () => setOverlay(null)
  const switchTo = (kind: Overlay['kind']) => (a: Administration) =>
    setOverlay({ kind, key: a.key })

  return (
    // The bottom padding clears the floating button, so the last row is never under it.
    <div className="pb-8">
      <PageHeader eyebrow={t('doses.eyebrow')} title={t('nav.log')} large />

      {doses.data && (admins.length > 0 || protocolRows.length > 0) && (
        <>
          <LogSummary
            kpis={kpis}
            punctuality={punctual}
            planOpen={planOpen}
            onTogglePlan={() => setPlanOpen((open) => !open)}
          />
          {planOpen && protocolRows.length > 0 && (
            <WeekCard
              protocols={protocolRows}
              doses={doseRows}
              extras={extras}
              onLog={
                readOnly
                  ? undefined
                  : (protocolId, plannedAt) => setLogging({ protocolId, plannedAt })
              }
              onEdit={readOnly ? undefined : (key) => setOverlay({ kind: 'actions', key })}
              onAssign={readOnly ? undefined : (extra) => void assignExtra(extra)}
            />
          )}
        </>
      )}

      {combos.length > 1 && <LogFilter value={filter} combos={combos} onChange={setFilter} />}

      {doses.isPending ? (
        <LogSkeleton />
      ) : admins.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Syringe className="size-7" />}
            title={t('doses.empty')}
            description={t('doses.emptyHint')}
            action={
              !readOnly && (
                <Button leading={<Plus className="size-4" />} onClick={() => setLogging({})}>
                  {t('doses.emptyAction')}
                </Button>
              )
            }
          />
        </Card>
      ) : days.length === 0 ? (
        <Card>
          <EmptyState
            title={t('doses.emptyFilter')}
            action={
              <Button variant="secondary" onClick={() => setFilter('all')}>
                {t('doses.filterAll')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {visibleDays.map(({ key, day, items }) => {
            const summary = summariseDay(items, fits)
            return (
              <section key={key}>
                <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="font-display text-[16px] font-semibold first-letter:uppercase">
                    {fmtRelativeDay(day, locale)}
                  </h2>
                  <span className="text-right text-[12.5px] text-muted">
                    {[
                      t('doses.count', { count: summary.count }),
                      ...(summary.late ? [t('doses.summary.late', { count: summary.late })] : []),
                      ...(summary.extras
                        ? [t('doses.summary.extra', { count: summary.extras })]
                        : []),
                    ].join(' · ')}
                  </span>
                </div>
                <Card padded={false} className="px-4">
                  <ul className="divide-y divide-line">
                    {items.map((a) => (
                      <AdministrationRow
                        key={a.key}
                        administration={a}
                        cell={cells.get(a.key)}
                        extra={extras.get(a.key)}
                        vials={vialById}
                        readOnly={readOnly}
                        onActions={openActions}
                        onAssign={assignExtra}
                      />
                    ))}
                  </ul>
                </Card>
              </section>
            )
          })}
          {days.length > shownDays && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={() => setShownDays((n) => n + DAYS_PER_PAGE)}
            >
              {t('common.showMore')}
            </Button>
          )}
        </div>
      )}

      {/* Within thumb reach; an empty log has its own button. */}
      {!readOnly && admins.length > 0 && (
        <FloatingAction>
          <Button
            className="pointer-events-auto shadow-xl"
            leading={<Plus className="size-5" />}
            onClick={() => setLogging({})}
          >
            {t('doses.logShort')}
          </Button>
        </FloatingAction>
      )}

      <LogDoseSheet
        key={logging?.protocolId ? `${logging.protocolId}:${logging.plannedAt?.getTime()}` : 'free'}
        open={logging !== null}
        onClose={() => setLogging(null)}
        protocolId={logging?.protocolId}
        plannedAt={logging?.plannedAt}
      />
      <DoseActionsSheet
        open={overlay?.kind === 'actions'}
        onClose={closeOverlay}
        administration={target}
        canAssign={Boolean(target && extras.get(target.key)?.missed.length)}
        onEdit={switchTo('edit')}
        onAssign={switchTo('assign')}
        onDelete={switchTo('delete')}
      />
      <EditDoseSheet
        open={overlay?.kind === 'edit'}
        onClose={closeOverlay}
        administration={target}
        onDelete={switchTo('delete')}
      />
      <AssignSlotSheet
        open={overlay?.kind === 'assign'}
        onClose={closeOverlay}
        administration={target}
        suggested={target ? extras.get(target.key)?.suggested?.at : undefined}
      />
      <DeleteDoseSheet
        open={overlay?.kind === 'delete'}
        onClose={closeOverlay}
        administration={target}
      />
    </div>
  )
}

function LogSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-[270px] w-full rounded-card" />
      {[0, 1].map((i) => (
        <section key={i}>
          <Skeleton className="mb-2 ml-1 h-3 w-24" />
          <Card padded={false} className="divide-y divide-line px-4">
            {[0, 1].slice(0, i === 0 ? 2 : 1).map((j) => (
              <div key={j} className="flex items-center gap-3 py-3.5">
                <Skeleton className="h-4 w-11" />
                <Skeleton className="h-10 w-1" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </Card>
        </section>
      ))}
    </div>
  )
}
