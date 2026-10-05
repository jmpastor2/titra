import { differenceInCalendarDays, getDayOfYear } from 'date-fns'
import { BellRing, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Card } from '@/components/ui/Card'
import { SectionTitle, Skeleton } from '@/components/ui/primitives'
import type { InventoryRow } from '@/data/database.types'
import { planDraw } from '@/domain/dosing/draw'
import type { StackComponent } from '@/domain/types'
import { useInventory } from '@/data/hooks'
import { CycleDecisions } from '@/features/cycle/CycleDecisions'
import { CycleOverview } from '@/features/cycle/CycleOverview'
import { LogDoseSheet } from '@/features/doses/LogDoseSheet'
import { StockAlerts } from '@/features/inventory/StockAlerts'
import { useStock } from '@/features/inventory/useStock'
import { activeVial, drawPartFor } from '@/features/inventory/vials'
import { useExposure } from '@/features/exposure/useExposure'
import { FastingCard } from '@/features/fasting/FastingCard'
import { upcomingAdministrations } from '@/features/reminders/plan'
import { needsFasting } from '@/features/fasting/fasting'
import { useReminderPrefs } from '@/features/reminders/useReminders'
import { QuickLog } from '@/features/quicklog/QuickLog'
import { FAST_WINDOW_H, type TileId } from '@/features/quicklog/tiles'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { AgendaRow } from './AgendaRow'
import { LearnCard } from './LearnCard'
import { NextDoseCard } from './NextDoseCard'
import { SetupLab } from './SetupLab'
import { useLastSevenDays } from './useLastSevenDays'
import { WeekGrid } from './WeekPulse'
import { agendaAddsToHero, buildToday, focusItem, summarise } from './agenda'
import { LevelCard, LevelCardSkeleton } from './LevelCard'

type SheetState = {
  kind: 'dose'
  protocolId?: string | null
  compoundId?: string
  plannedAt?: Date
} | null

/**
 * Hoy, in the order of what needs the person: the next dose, then what the cycles ask, today's
 * agenda and the last seven days; after that the cycles, stock and levels to look at, and the
 * quick log. `embedded` renders the page inside another screen (a shared, read-only view)
 * without its header.
 */
export function TodayPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient, readOnly } = usePatientScope()
  const now = useNow()
  const exposure = useExposure(patientId, now)
  const inventory = useInventory(patientId)
  const reminders = useReminderPrefs()
  const stock = useStock(patientId, now)
  const [openSheet, setSheet] = useState<SheetState>(null)
  const [params, setParams] = useSearchParams()
  const logParam = params.get('log')
  const cycleFocus = params.get('cycle')
  // A reminder links to /#/?log=<protocolId>: the log sheet for it opens straight away.
  const sheet: SheetState =
    openSheet ?? (logParam && !readOnly ? { kind: 'dose', protocolId: logParam } : null)
  const closeSheet = () => {
    setSheet(null)
    if (logParam)
      setParams(
        (p) => {
          p.delete('log')
          return p
        },
        { replace: true },
      )
  }

  const items = useMemo(
    () => buildToday(exposure.protocols, exposure.doses, now),
    [exposure.protocols, exposure.doses, now],
  )
  const summary = summarise(items.filter((i) => !i.extra))
  const week = useLastSevenDays(exposure.protocols, exposure.doses, now)
  const weekExtras = week.days.flatMap((d) => d.cells).filter((c) => c.status === 'extra').length
  const focus = focusItem(items)
  // Compounds that ride along in another protocol's syringe or blend vial are shown on that
  // protocol's card, not on their own.
  const tracked = exposure.items.filter((x) => (x.protocol || x.lastDose) && !x.partnerOf)
  const firstStart = exposure.protocols
    .filter((p) => p.status === 'active')
    .map((p) => new Date(p.start_date))
    .toSorted((a, b) => a.getTime() - b.getTime())[0]
  const dayN = firstStart ? differenceInCalendarDays(now, firstStart) + 1 : null

  // One substance to learn about today, rotating through the ones in use.
  const learn = tracked.length ? tracked[getDayOfYear(now) % tracked.length]?.compound : undefined

  const hasProtocols = exposure.protocols.some((p) => p.status === 'active')
  const vials = inventory.data ?? []
  const focusUnits = focus ? unitsToDraw(focus.doses, vials) : null
  // Nothing left today: the next administration on any later day.
  const nextUp = focus
    ? null
    : (upcomingAdministrations(exposure.protocols, exposure.doses, vials, now, {
        horizonDays: 14,
      })[0] ?? null)
  const nothingLeft = summary.total
    ? t('today.allDone')
    : items.length
      ? t('today.onlyExtra', { count: items.length })
      : t('today.nothingToday')

  // The next GH-secretagogue shot within the fast window asks for a fasting window (the same
  // window the quick log's Ayuno tile counts to, so the two always agree).
  const fastFor = items.find(
    (i) =>
      (i.status === 'due' ||
        i.status === 'overdue' ||
        (i.status === 'upcoming' && i.at.getTime() - now.getTime() < FAST_WINDOW_H * 3_600_000)) &&
      needsFasting(i.doses.map((d) => d.compoundId)),
  )
  const fastingShown = !readOnly && Boolean(fastFor)

  // The quick log leaves out what this screen already says: the next dose has its card, and
  // an open fast has its own.
  const omit = useMemo<TileId[]>(
    () => [
      ...(hasProtocols ? (['dose'] as const) : []),
      ...(fastingShown ? (['fasting'] as const) : []),
    ],
    [hasProtocols, fastingShown],
  )

  // Section numbers follow what is actually on screen.
  let section = 0
  const nextIndex = () => String(++section).padStart(2, '0')

  return (
    <div
      className={
        embedded
          ? 'flex flex-col gap-4 pt-2'
          : 'flex flex-col gap-4 pt-[max(env(safe-area-inset-top),18px)]'
      }
    >
      {!embedded && (
        <header className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="spec">
              {fmtDate(now, locale, 'EEE d MMM').toUpperCase()}
              {dayN && dayN > 0 ? ` · ${t('today.dayN', { n: dayN })}` : ''}
            </div>
            <h1 className="mt-1 truncate font-display text-[32px] font-bold leading-none">
              {readOnly ? patient?.display_name : t('today.title')}
            </h1>
          </div>
          {!readOnly && (
            <Link
              to="/settings"
              aria-label={t('more.settings')}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-panel font-display text-[15px] font-bold text-signal"
            >
              {(patient?.display_name ?? '?').trim().charAt(0).toUpperCase()}
            </Link>
          )}
        </header>
      )}

      {exposure.isPending ? (
        <Card>
          <Skeleton className="h-[120px] w-full" />
        </Card>
      ) : !hasProtocols && tracked.length === 0 ? (
        <SetupLab readOnly={readOnly} onFreeDose={() => setSheet({ kind: 'dose' })} />
      ) : (
        <NextDoseCard
          focus={focus}
          nextUp={nextUp}
          units={focusUnits}
          message={nothingLeft}
          week={week}
          weekExtras={weekExtras}
          now={now}
          readOnly={readOnly}
          onLog={() =>
            focus && setSheet({ kind: 'dose', protocolId: focus.protocol.id, plannedAt: focus.at })
          }
          onLogOther={() => setSheet({ kind: 'dose' })}
        />
      )}

      {fastingShown && fastFor && <FastingCard name={fastFor.protocol.name} />}

      {hasProtocols && <CycleDecisions focusProtocolId={cycleFocus} />}

      {items.length > 0 && agendaAddsToHero(items, focus) && (
        <section>
          <SectionTitle index={nextIndex()}>{t('today.agenda')}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {items.map((i) => (
              <AgendaRow
                key={i.key}
                item={i}
                now={now}
                units={unitsToDraw(i.doses, vials)}
                readOnly={readOnly}
                onLog={() => setSheet({ kind: 'dose', protocolId: i.protocol.id, plannedAt: i.at })}
              />
            ))}
          </ul>
        </section>
      )}

      {hasProtocols && !exposure.isPending && (
        <section>
          <SectionTitle
            index={nextIndex()}
            action={
              !readOnly && (
                <Link to="/log" className="spec text-signal">
                  {t('nav.log')}
                </Link>
              )
            }
          >
            {t('today.week')}
          </SectionTitle>
          <Card>
            <WeekGrid days={week.days} protocols={exposure.protocols} now={now} />
          </Card>
        </section>
      )}

      {hasProtocols && <CycleOverview focusProtocolId={cycleFocus} index={nextIndex()} />}

      {!readOnly && stock.alerts.length > 0 && (
        <section>
          <SectionTitle index={nextIndex()}>{t('today.stock')}</SectionTitle>
          <StockAlerts alerts={stock.alerts} limit={2} linkTo="/inventory" />
        </section>
      )}

      {!readOnly && hasProtocols && reminders.loaded && !reminders.enabled && (
        <Link
          to="/reminders"
          className="card flex items-center gap-3 px-4 py-3 transition active:scale-[0.99]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-signal/30 bg-signal-soft text-signal">
            <BellRing aria-hidden className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">{t('today.remindersOff')}</span>
            <span className="block text-[12px] text-muted">{t('today.remindersOffHint')}</span>
          </span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
        </Link>
      )}

      {exposure.isPending && (
        <section aria-hidden>
          <SectionTitle index={nextIndex()}>{t('today.levels')}</SectionTitle>
          <div className="hide-scrollbar -mx-4 flex gap-3 overflow-hidden px-4 pb-1">
            <LevelCardSkeleton />
            <LevelCardSkeleton />
            <LevelCardSkeleton />
          </div>
        </section>
      )}

      {tracked.length > 0 && (
        <section>
          <SectionTitle
            index={nextIndex()}
            action={
              !readOnly && (
                <Link to="/protocols" className="spec text-signal">
                  {t('today.manage')}
                </Link>
              )
            }
          >
            {t('today.levels')}
          </SectionTitle>
          <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {tracked.map((x) => (
              <LevelCard
                key={x.compoundId}
                x={x}
                now={now}
                vial={activeVial(vials, x.compoundId, x.next?.doseMg)}
              />
            ))}
          </div>
        </section>
      )}

      {!readOnly && <QuickLog index={nextIndex()} omit={omit} />}

      {learn && (
        <section>
          <SectionTitle index={nextIndex()}>{t('today.learn')}</SectionTitle>
          <LearnCard compound={learn} />
        </section>
      )}

      <p className="px-2 pb-2 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>

      <LogDoseSheet
        // A reminder tapped while the sheet is open switches it to that protocol.
        key={sheet?.kind === 'dose' ? (sheet.protocolId ?? sheet.compoundId ?? 'free') : 'closed'}
        open={sheet?.kind === 'dose'}
        onClose={closeSheet}
        protocolId={sheet?.kind === 'dose' ? sheet.protocolId : undefined}
        compoundId={sheet?.kind === 'dose' ? sheet.compoundId : undefined}
        plannedAt={sheet?.kind === 'dose' ? sheet.plannedAt : undefined}
      />
    </div>
  )
}

/** Units to draw for an administration, when every compound has a reconstituted vial. */
function unitsToDraw(doses: readonly StackComponent[], vials: readonly InventoryRow[]) {
  const plan = planDraw(doses.map((d) => drawPartFor(vials, d.compoundId, d.doseMg)))
  return plan && plan.unknown.length === 0 ? plan.totalUnits : null
}
