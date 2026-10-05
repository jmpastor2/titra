import { addDays, startOfWeek } from 'date-fns'
import { clsx } from 'clsx'
import { Check, ChevronRight, Diamond, Info, Moon, X } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ProgressRing, SubstanceDot, Skeleton, Vial } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { DoseRow, InventoryRow, ProtocolRow, ProtocolStatus } from '@/data/database.types'
import { useDoses, useInventory, useProtocols } from '@/data/hooks'
import { protocolCompoundIds, toDoseEvent } from '@/data/mappers'
import { adherence } from '@/domain/dosing/schedule'
import { weekPlanVsActual, type WeekCell, type WeekStatus } from '@/features/doses/week'
import { activeVial, concentrationFor, vialLook } from '@/features/inventory/vials'
import { fmtDate, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { useCycleText } from './cycleText'
import { doseView, fmtDoseView, type DoseView } from './cycleView'
import { fmtPerUnit } from './doseUnits'
import { NextChange } from './NextChange'
import { PlanTimeline } from './PlanTimeline'
import { DetailActions } from './ProtocolButtons'
import { ProtocolSheets } from './ProtocolSheets'
import { useScheduleLabel } from './scheduleLabel'
import { useProtocolActions } from './useProtocolActions'
import { useUndoOffer, type UndoState } from './useUndoOffer'

const STATUS_TONE: Record<ProtocolStatus, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  paused: 'warn',
  completed: 'neutral',
  archived: 'neutral',
}

/**
 * One protocol, read first: where the cycle stands, every step with its dates, the week
 * planned against what was taken, adherence, the vial in use and the notes; the actions
 * (edit, keep this week, pause…) are big and below the headline.
 */
export function ProtocolDetailPage() {
  const { t } = useTranslation()
  const { protocolId } = useParams()
  const { patientId, readOnly, canPrescribe } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 60)
  const inventory = useInventory(patientId)
  const now = useNow()
  const undo = useUndoOffer()
  const vials = useMemo(() => inventory.data ?? [], [inventory.data])

  if (protocols.isPending) {
    return (
      <div className="pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-60 w-full" />
      </div>
    )
  }
  const p = protocols.data?.find((x) => x.id === protocolId)
  if (!p) return <PageHeader title={t('errors.notFound')} back="/protocols" />

  return (
    <>
      <ProtocolDetail
        p={p}
        doses={doses.data ?? []}
        vials={vials}
        now={now}
        canEdit={!readOnly || canPrescribe}
        undo={undo}
      />
    </>
  )
}

function ProtocolDetail({
  p,
  doses,
  vials,
  now,
  canEdit,
  undo,
}: {
  p: ProtocolRow
  doses: readonly DoseRow[]
  vials: readonly InventoryRow[]
  now: Date
  canEdit: boolean
  undo: UndoState
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const scheduleLabel = useScheduleLabel()
  const actions = useProtocolActions({ protocol: p, vials, now, offerUndo: undo.show })
  const { pl, summary } = actions
  const ids = protocolCompoundIds(p)
  const color = compoundColor(p.compound_id)
  const names = ids.map((id) => compoundById(id)?.names.generic ?? id).join(' + ')
  const subtitle =
    names.toLocaleLowerCase(locale) === p.name.trim().toLocaleLowerCase(locale) ? undefined : names

  const mine = useMemo(
    () =>
      doses
        .filter(
          (d) => d.compound_id === p.compound_id && (!d.protocol_id || d.protocol_id === p.id),
        )
        .map(toDoseEvent),
    [doses, p],
  )
  const adh = useMemo(
    () => (p.status === 'archived' ? null : adherence(pl, mine, now)),
    [pl, mine, now, p.status],
  )

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PageHeader
        eyebrow={t('protocolDetail.eyebrow')}
        title={p.name}
        // The substances, unless the name already says exactly that.
        subtitle={subtitle}
        back="/protocols"
        action={<Badge tone={STATUS_TONE[p.status]}>{t(`protocols.statuses.${p.status}`)}</Badge>}
      />

      {summary && (
        <Card instrument tone="signal">
          <div className="flex items-center gap-4">
            {summary.info.fraction !== null && (
              <ProgressRing fraction={summary.info.fraction} size={88} stroke={7} color={color}>
                <span className="readout text-[15px] font-semibold">
                  {Math.round(summary.info.fraction * 100)}%
                </span>
              </ProgressRing>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {ids.map((id) => (
                  <SubstanceDot key={id} color={compoundColor(id)} />
                ))}
                <span className="spec">{scheduleLabel(pl.steps, pl.times)}</span>
              </div>
              <div className="mt-1 font-display text-[24px] font-bold leading-tight">
                {text.phase(summary)}
              </div>
              <div className="readout mt-0.5 text-[12px] text-muted">
                {fmtDate(summary.info.startsOn, locale, 'd MMM yyyy')}
                {summary.info.endsOn
                  ? ` → ${fmtDate(addDays(summary.info.endsOn, -1), locale, 'd MMM yyyy')}`
                  : ` · ${t('protocols.timeline.noEnd')}`}
              </div>
            </div>
          </div>

          {summary.dose && <DoseNow actions={actions} />}

          {summary.next && (
            <p className="mt-3 text-[14px] font-medium leading-snug text-ink">
              <NextChange summary={summary} />
            </p>
          )}

          {canEdit && actions.hold && summary.info.decisionDue && summary.next && (
            <div className="mt-3 rounded-control border border-warn/30 bg-warn-soft px-3.5 py-3">
              <p className="text-[13px] font-medium leading-snug text-ink">
                {t('protocols.cycle.decision', {
                  date: text.day(summary.next.change.on),
                  dose: summary.next.dose ? text.doseShort(summary.next.dose) : '',
                })}
              </p>
              <Button
                size="md"
                variant="secondary"
                className="mt-2.5"
                onClick={() => actions.open('hold')}
              >
                {t('protocolMenu.hold')}
              </Button>
            </div>
          )}

          {(summary.info.phase === 'finished' || summary.info.phase === 'rest') && (
            <Link
              to="/cycles"
              className="mt-3 flex min-h-11 items-center justify-between rounded-control border border-line-strong bg-panel-2 px-3.5 text-[14px] font-semibold text-signal"
            >
              {t('protocolDetail.seeCycles')}
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          )}
        </Card>
      )}

      {canEdit && <DetailActions actions={actions} />}

      {summary && (
        <Card title={t('protocolDetail.timeline')}>
          <PlanTimeline
            info={summary.info}
            now={now}
            color={color}
            doseOf={(step) => {
              const { units, mass } = fmtDoseView(doseView(pl, step.doseMg, vials), locale)
              return { main: units ?? mass, ...(units ? { sub: mass } : {}) }
            }}
          />
        </Card>
      )}

      {p.status !== 'archived' && (
        <WeekCard p={p} doses={doses} now={now} adh={adh} dose={summary?.dose ?? null} />
      )}

      <VialsCard protocol={p} vials={vials} />

      {p.notes && (
        <Card title={t('protocols.notes')}>
          <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-warn" />
            {p.notes}
          </p>
        </Card>
      )}

      {canEdit && <ProtocolSheets actions={actions} />}
    </div>
  )
}

/** The dose in force, as drawn and as mass. */
function DoseNow({ actions: a }: { actions: ReturnType<typeof useProtocolActions> }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dose = a.summary?.dose ? fmtDoseView(a.summary.dose, locale) : null
  if (!dose) return null
  return (
    <div className="mt-4">
      <div className="spec">{t('protocolDetail.doseNow')}</div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <span className="readout text-[34px] font-semibold leading-none">
          {dose.units ?? dose.mass}
        </span>
        {dose.units && <span className="readout text-[14px] text-muted">({dose.mass})</span>}
      </div>
    </div>
  )
}

const STATUS_MARK: Record<WeekStatus, string> = {
  onTime: 'text-signal',
  late: 'text-warn',
  early: 'text-warn',
  missed: 'text-danger',
  due: 'text-warn',
  upcoming: 'text-muted',
  extra: 'text-accent',
}

function WeekMark({ status }: { status: WeekStatus }) {
  const cls = clsx('size-4', STATUS_MARK[status])
  if (status === 'onTime' || status === 'late' || status === 'early') {
    return <Check aria-hidden className={cls} strokeWidth={3} />
  }
  if (status === 'missed') return <X aria-hidden className={cls} strokeWidth={3} />
  if (status === 'extra') return <Diamond aria-hidden className={cls} />
  return (
    <span
      aria-hidden
      className={clsx(
        'block size-3 rounded-full border-[1.5px]',
        status === 'due' ? 'pulse-ring border-warn' : 'border-line-strong',
      )}
    />
  )
}

/** This week's administrations against what was injected. */
function WeekCard({
  p,
  doses,
  now,
  adh,
  dose,
}: {
  p: ProtocolRow
  doses: readonly DoseRow[]
  now: Date
  adh: ReturnType<typeof adherence> | null
  dose: DoseView | null
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const days = useMemo(
    () => weekPlanVsActual([p], doses, startOfWeek(now, { weekStartsOn: 1 }), now),
    [p, doses, now],
  )
  const cells = days.flatMap((d) => d.cells.map((c) => ({ day: d.day, cell: c })))
  // What the plan asked for this week, taken or not yet; shots outside it are counted apart.
  const planned = cells.filter((c) => c.cell.status !== 'extra')
  const taken = planned.filter((c) => c.cell.takenAt).length
  const extras = cells.length - planned.length
  const clock = (d: Date) => fmtDate(d, locale, 'HH:mm')
  const doseText = dose ? fmtDoseView(dose, locale) : null

  return (
    <Card
      title={t('protocolDetail.week')}
      subtitle={
        doseText
          ? t('protocolDetail.weekDose', { dose: doseText.units ?? doseText.mass })
          : undefined
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="spec">{t('protocolDetail.weekTaken')}</div>
          <div className="readout mt-1 text-[24px] font-semibold leading-none">
            {taken}
            <span className="text-[14px] text-muted">/{planned.length}</span>
            {extras > 0 && (
              <span className="ml-1.5 text-[12px] font-medium text-accent">
                {t('protocolDetail.weekExtras', { count: extras })}
              </span>
            )}
          </div>
        </div>
        {adh && adh.expected > 0 && (
          <div>
            <div className="spec">{t('protocols.adherence')}</div>
            <div
              className={clsx(
                'readout mt-1 text-[24px] font-semibold leading-none',
                adh.ratio >= 0.9 ? 'text-signal' : 'text-warn',
              )}
            >
              {Math.round(adh.ratio * 100)}%
              <span className="ml-1.5 text-[12px] font-medium text-muted">
                {adh.taken}/{adh.expected}
              </span>
            </div>
          </div>
        )}
      </div>

      {cells.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">{t('protocolDetail.weekNone')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {cells.map(({ day, cell }) => (
            <WeekRow
              key={`${cell.plannedAt.getTime()}-${cell.status}`}
              day={day}
              cell={cell}
              clock={clock}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

function WeekRow({ day, cell, clock }: { day: Date; cell: WeekCell; clock: (d: Date) => string }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  // A 01:00 shot belongs to the evening before: say so.
  const night = cell.plannedAt.getDate() !== day.getDate()
  const delta = cell.deltaMin
  return (
    <li className="flex min-h-11 items-center gap-3 py-2">
      <WeekMark status={cell.status} />
      <span className="w-[68px] shrink-0 text-[13.5px] font-semibold">
        {fmtDate(day, locale, 'EEE d')}
      </span>
      <span className="readout flex items-center gap-1 text-[13px] text-ink-2">
        {clock(cell.plannedAt)}
        {night && <Moon aria-label={t('protocolDetail.night')} className="size-3 text-muted" />}
      </span>
      <span
        className={clsx('ml-auto text-right text-[12.5px] font-medium', STATUS_MARK[cell.status])}
      >
        {cell.status === 'extra'
          ? t('protocolDetail.status.extra', { time: clock(cell.takenAt ?? cell.plannedAt) })
          : cell.takenAt
            ? t(`protocolDetail.status.${cell.status}`, {
                time: clock(cell.takenAt),
                delta: delta === null ? '' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} min`,
              })
            : t(`protocolDetail.status.${cell.status}`)}
      </span>
    </li>
  )
}

/** The vial each compound of the protocol is drawn from; a blend is one vial. */
function VialsCard({
  protocol: p,
  vials,
}: {
  protocol: ProtocolRow
  vials: readonly InventoryRow[]
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const rows = useMemo(() => {
    const seen = new Set<string>()
    return protocolCompoundIds(p).flatMap((id) => {
      const vial = activeVial(vials, id)
      if (!vial || seen.has(vial.id)) return []
      seen.add(vial.id)
      return [{ vial, conc: concentrationFor(vial, id) }]
    })
  }, [p, vials])

  return (
    <Card
      title={t('protocolDetail.vials')}
      action={
        <Link to="/inventory" className="spec text-signal">
          {t('protocolDetail.inventory')}
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-[13.5px] text-muted">{t('protocolDetail.noVial')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ vial, conc }) => {
            const look = vialLook(vial)
            return (
              <li key={vial.id} className="flex items-center gap-3">
                <Vial
                  color={look.color}
                  {...(look.colors ? { colors: look.colors } : {})}
                  state={look.state}
                  fill={look.fill}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold">{vial.label}</div>
                  <div className="readout text-[12px] text-muted">
                    {t('protocolDetail.vialLeft', {
                      left: fmtNumber(Number(vial.remaining_mg), locale, 2),
                      total: fmtNumber(Number(vial.total_mg), locale, 2),
                    })}
                  </div>
                  <div className="readout text-[12px] text-signal">
                    {conc
                      ? t('protocolDetail.vialUnit', { per: fmtPerUnit(conc, locale) })
                      : t('protocolDetail.vialPowder')}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
