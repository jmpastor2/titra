import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { SectionTitle, Skeleton } from '@/components/ui/primitives'
import type { InventoryRow } from '@/data/database.types'
import { useInventory } from '@/data/hooks'
import { planDraw } from '@/domain/dosing/draw'
import type { StackComponent } from '@/domain/types'
import { CycleDecisions } from '@/features/cycle/CycleDecisions'
import { LogDoseSheet } from '@/features/doses/LogDoseSheet'
import { useExposure } from '@/features/exposure/useExposure'
import { needsFasting } from '@/features/fasting/fasting'
import { useStock } from '@/features/inventory/useStock'
import { drawPartFor } from '@/features/inventory/vials'
import { FastingSheet } from '@/features/quicklog/FastingSheet'
import { QuickLog } from '@/features/quicklog/QuickLog'
import { FAST_WINDOW_H, type TileId } from '@/features/quicklog/tiles'
import { upcomingAdministrations } from '@/features/reminders/plan'
import { useReminderPrefs } from '@/features/reminders/useReminders'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { buildToday, focusItem, longDate } from './agenda'
import { FastingLine } from './FastingLine'
import { KpiGrid } from './KpiGrid'
import { LevelsCard, LevelsCardSkeleton } from './LevelsCard'
import { NextDoseCard, type HeroDose } from './NextDoseCard'
import { RemindersNotice, StockNotice } from './Notices'
import { SetupLab } from './SetupLab'
import { heroRows, slotKey, trackItems, windowItems } from './track'
import { useHomeKpis } from './useHomeKpis'

/** Tiles of the quick log on this screen, "Más" aside: two columns by three rows. */
const QUICK_TILES = 5
const HOUR_MS = 3_600_000

type SheetState =
  { kind: 'dose'; protocolId?: string | null; plannedAt?: Date } | { kind: 'fasting' } | null

/**
 * Hoy, a calm control panel in six blocks: the date; the next dose with the day around it;
 * four tiles that say whether the plan is on track; the one decision the cycles ask for; the
 * quick log; and the levels. A stock problem that cannot wait, or reminders switched off, adds
 * one slim row. `embedded` renders the page inside another screen (a shared, read-only view)
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

  const { protocols, doses } = exposure
  const vials = inventory.data ?? NO_VIALS
  const hasProtocols = protocols.some((p) => p.status === 'active')
  // Compounds that ride along in another protocol's syringe or blend vial are shown on that
  // protocol's row, not on their own.
  const tracked = exposure.items.filter((x) => (x.protocol || x.lastDose) && !x.partnerOf)

  const day = useMemo(() => {
    const today = buildToday(protocols, doses, now)
    const focus = focusItem(today)
    // Nothing left today: the next administration on any later day.
    const next = focus
      ? null
      : (upcomingAdministrations(protocols, doses, vials, now, { horizonDays: 14 })[0] ?? null)
    const dose: HeroDose | null = focus ?? (next && { ...next, status: 'upcoming' })
    const heroKey = dose ? slotKey(dose.protocol.id, dose.at) : null
    const window = windowItems(protocols, doses, now)
    return {
      dose,
      units: focus ? unitsToDraw(focus.doses, vials) : (next?.totalUnits ?? null),
      track: trackItems(window, heroKey),
      rows: heroRows(today, window, heroKey),
    }
  }, [protocols, doses, vials, now])

  const kpis = useHomeKpis(protocols, doses, readOnly ? null : stock.restock, now)

  // The hero's dose asks for a fast when it is a GH secretagogue within the fast window (the
  // same window the quick log's Ayuno tile counts to, so the two always agree).
  const fastFor =
    !readOnly &&
    day.dose &&
    needsFasting(day.dose.doses.map((d) => d.compoundId)) &&
    day.dose.at.getTime() - now.getTime() < FAST_WINDOW_H * HOUR_MS
      ? day.dose
      : null

  // The quick log leaves out what this screen already says: the next dose has the hero, and
  // its fast a line in it.
  const omit = useMemo<TileId[]>(() => (fastFor ? ['dose', 'fasting'] : ['dose']), [fastFor])

  return (
    <div
      className={
        embedded
          ? 'flex flex-col gap-3 pt-2'
          : 'flex flex-col gap-3 pt-[max(env(safe-area-inset-top),18px)]'
      }
    >
      {!embedded && (
        <header className="mb-1 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium text-muted">{longDate(now, locale)}</p>
            <h1 className="mt-0.5 break-words font-display text-[34px] font-bold leading-tight">
              {readOnly ? patient?.display_name : t('today.title')}
            </h1>
          </div>
          {!readOnly && (
            <Link
              to="/settings"
              aria-label={t('more.settings')}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-panel-3 font-display text-[15px] font-semibold text-ink-2"
            >
              {(patient?.display_name ?? '?').trim().charAt(0).toUpperCase()}
            </Link>
          )}
        </header>
      )}

      {exposure.isPending ? (
        <div className="card p-4" aria-hidden>
          <Skeleton className="h-[260px] w-full" />
        </div>
      ) : !hasProtocols && tracked.length === 0 ? (
        <SetupLab readOnly={readOnly} onFreeDose={() => setSheet({ kind: 'dose' })} />
      ) : (
        <NextDoseCard
          dose={day.dose}
          units={day.units}
          track={day.track}
          rows={day.rows}
          unitsOf={(item) => unitsToDraw(item.doses, vials)}
          now={now}
          readOnly={readOnly}
          aside={fastFor && <FastingLine onOpen={() => setSheet({ kind: 'fasting' })} />}
          onLog={() =>
            day.dose &&
            setSheet({ kind: 'dose', protocolId: day.dose.protocol.id, plannedAt: day.dose.at })
          }
          onLogItem={(item) =>
            setSheet({ kind: 'dose', protocolId: item.protocol.id, plannedAt: item.at })
          }
          onLogOther={() => setSheet({ kind: 'dose' })}
        />
      )}

      {hasProtocols && !exposure.isPending && (
        <KpiGrid kpis={kpis} vials={vials} now={now} linked={!readOnly} />
      )}

      {hasProtocols && <CycleDecisions focusProtocolId={cycleFocus} />}

      {!readOnly && <StockNotice alerts={stock.alerts} />}
      {!readOnly && hasProtocols && reminders.loaded && !reminders.enabled && <RemindersNotice />}

      {!readOnly && <QuickLog className="mt-2" omit={omit} max={QUICK_TILES} />}

      {(exposure.isPending || tracked.length > 0) && (
        <section aria-label={t('today.levels')}>
          <SectionTitle
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
          {exposure.isPending ? <LevelsCardSkeleton /> : <LevelsCard items={tracked} />}
        </section>
      )}

      <p className="px-2 pb-2 pt-3 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>

      <LogDoseSheet
        // A reminder tapped while the sheet is open switches it to that protocol.
        key={sheet?.kind === 'dose' ? (sheet.protocolId ?? 'free') : 'closed'}
        open={sheet?.kind === 'dose'}
        onClose={closeSheet}
        protocolId={sheet?.kind === 'dose' ? sheet.protocolId : undefined}
        plannedAt={sheet?.kind === 'dose' ? sheet.plannedAt : undefined}
      />
      {sheet?.kind === 'fasting' && (
        <FastingSheet
          fastFor={
            fastFor && {
              protocolId: fastFor.protocol.id,
              at: fastFor.at,
              compoundIds: fastFor.doses.map((d) => d.compoundId),
              name: fastFor.protocol.name,
              units: day.units,
            }
          }
          onClose={closeSheet}
        />
      )}
    </div>
  )
}

const NO_VIALS: readonly InventoryRow[] = []

/** Units to draw for an administration, when every compound has a reconstituted vial. */
function unitsToDraw(doses: readonly StackComponent[], vials: readonly InventoryRow[]) {
  const plan = planDraw(doses.map((d) => drawPartFor(vials, d.compoundId, d.doseMg)))
  return plan && plan.unknown.length === 0 ? plan.totalUnits : null
}
