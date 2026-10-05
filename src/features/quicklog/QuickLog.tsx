/**
 * Registro rápido: the home screen's panel of live tiles. Each tile shows where that
 * record stands (what is due, the last reading, today's total) and takes the next entry in
 * a tap or two; the most pressing come first and the rest wait in "Más". Self-contained:
 * it reads and writes through the shared hooks and renders its own sheets.
 */
import { clsx } from 'clsx'
import { Ellipsis, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Badge, Skeleton } from '@/components/ui/primitives'
import type { MeasurementKind } from '@/data/database.types'
import { useDoses, useInventory, useProtocols, useSymptoms } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { LogDoseSheet } from '@/features/doses/LogDoseSheet'
import { useLastMeal } from '@/features/fasting/fasting'
import { AddLabSheet } from '@/features/health/AddLabSheet'
import { LogMeasurementSheet } from '@/features/health/LogMeasurementSheet'
import { LogSymptomSheet } from '@/features/symptoms/LogSymptomSheet'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { BodyMeasuresSheet } from './BodyMeasuresSheet'
import { ProteinSheet, WaterSheet } from './CounterSheet'
import { doseGlance } from './doseGlance'
import { FastingSheet } from './FastingSheet'
import { MoreSheet, type HiddenTile, type MoreTarget } from './MoreSheet'
import { QuickTile, TileAction, Word } from './QuickTile'
import { buildRanks } from './ranks'
import { StrengthSheet } from './StrengthSheet'
import { TileCell } from './TileCell'
import { rankTiles, type TileId } from './tiles'
import { summaryOf, tileView, type TileContext } from './tileViews'
import { useQuickActions } from './useQuickActions'
import { useQuickData } from './useQuickData'
import { useStableOrder } from './useStableOrder'
import { useWaterGoal } from './water'

type Active =
  | { kind: 'dose'; protocolId?: string; plannedAt?: Date }
  | { kind: 'measure'; measure: MeasurementKind }
  | { kind: 'counter'; counter: 'hydration_ml' | 'protein_g' }
  | { kind: 'checkin' | 'symptom' | 'lab' | 'body' | 'strength' | 'fasting' | 'more' }

interface QuickLogProps {
  className?: string
  /** Section number in the silkscreen style of the other sections of the screen ("04"). */
  index?: string
  /**
   * Tiles the screen already says in its own way (the next dose has its card, an open fast
   * has its own): left out of the grid, so nothing is said twice.
   */
  omit?: readonly TileId[]
}

const OMIT_NONE: readonly TileId[] = []

/** The panel; nothing at all in a shared, read-only view. */
export function QuickLog({ className, index, omit }: QuickLogProps) {
  const { readOnly } = usePatientScope()
  return readOnly ? null : <QuickLogPanel className={className} index={index} omit={omit} />
}

function QuickLogPanel({ className, index, omit = OMIT_NONE }: QuickLogProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId, patient } = usePatientScope()
  const now = useNow(30_000)

  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 365)
  const inventory = useInventory(patientId)
  const symptoms = useSymptoms(patientId, 90)
  const { data, pending } = useQuickData(now)
  const goalMl = useWaterGoal()
  const lastMeal = useLastMeal(now)

  const [sheet, setSheet] = useState<Active | null>(null)

  const ready =
    !pending &&
    !protocols.isPending &&
    !doses.isPending &&
    !inventory.isPending &&
    !symptoms.isPending

  const minute = Math.floor(now.getTime() / 60_000)
  const glance = useMemo(
    () =>
      doseGlance(
        protocols.data ?? [],
        doses.data ?? [],
        inventory.data ?? [],
        new Date(minute * 60_000),
      ),
    [protocols.data, doses.data, inventory.data, minute],
  )

  // Which tiles, and in what order: the pressing first, steady while a finger is on them.
  const ranks = useMemo(
    () => buildRanks({ data, glance, goalMl, now }).filter((r) => !omit.includes(r.id)),
    [data, glance, goalMl, now, omit],
  )
  const ranked = useMemo(() => rankTiles(ranks), [ranks])
  const { order, touch } = useStableOrder(ranked.shown, ready)
  const visible = order.filter((id) => ranks.some((r) => r.id === id))
  const hiddenIds = rankTiles(ranks, ranks.length).shown.filter((id) => !visible.includes(id))

  const views = useMemo(() => {
    const ctx: TileContext = {
      t,
      locale,
      now,
      data,
      glance,
      symptoms: symptoms.data ?? [],
      goalMl,
      lastMeal,
      tiers: new Map(ranks.map((r) => [r.id, r.tier])),
    }
    return new Map(ranks.map((r) => [r.id, tileView(r.id, ctx)]))
  }, [t, locale, now, data, glance, symptoms.data, goalMl, lastMeal, ranks])

  const close = () => {
    touch()
    setSheet(null)
  }
  const actions = useQuickActions(patientId, close)

  function press(id: TileId) {
    touch()
    switch (id) {
      case 'dose': {
        const { status, dose } = glance
        setSheet(
          dose && status !== 'done' && status !== 'none'
            ? { kind: 'dose', protocolId: dose.protocolId, plannedAt: dose.at }
            : { kind: 'dose' },
        )
        return
      }
      case 'water':
        actions.tapWater(data.water.total, goalMl)
        return
      case 'protein':
        setSheet({ kind: 'counter', counter: 'protein_g' })
        return
      case 'weight':
      case 'waist':
        setSheet({ kind: 'measure', measure: id })
        return
      case 'checkin':
      case 'symptom':
      case 'strength':
      case 'fasting':
        setSheet({ kind: id })
        return
    }
  }

  function pick(target: MoreTarget) {
    switch (target.kind) {
      case 'tile':
        press(target.id)
        return
      case 'measure':
        setSheet({ kind: 'measure', measure: target.measure })
        return
      case 'dose':
        setSheet({ kind: 'dose' })
        return
      case 'lab':
      case 'body':
        setSheet({ kind: target.kind })
        return
    }
  }

  const hidden: HiddenTile[] = hiddenIds.flatMap((id) => {
    const v = views.get(id)
    return v ? [{ id, icon: v.icon, label: v.label, summary: summaryOf(v) }] : []
  })
  // What the grid highlights is what it counts: a fast already done is a green tile, not a to-do.
  const asking = (id: TileId) => {
    const tone = views.get(id)?.tone
    return tone === 'attention' || tone === 'urgent'
  }
  const pendingCount = ranks.filter((r) => asking(r.id)).length
  const doseKey = sheet?.kind === 'dose' ? (sheet.protocolId ?? 'free') : 'closed'

  return (
    <section
      aria-label={t('quick.title')}
      className={clsx('card instrument fade-up p-4', className)}
    >
      <header className="mb-3 flex min-h-7 items-center justify-between gap-3 pl-1.5">
        <h2 className="spec flex items-center gap-2">
          {index && <span className="text-signal">{index}</span>}
          <span>{t('quick.title')}</span>
        </h2>
        {ready && pendingCount > 0 && (
          <Badge tone="warn">{t('quick.pending', { count: pendingCount })}</Badge>
        )}
      </header>

      <div className="@container">
        <div className="grid grid-cols-2 gap-2 @xl:grid-cols-4">
          {!ready ? (
            Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[92px]" />)
          ) : (
            <>
              {visible.map((id) => {
                const view = views.get(id)
                return view ? (
                  <TileCell
                    key={id}
                    view={view}
                    onPress={() => press(id)}
                    corner={
                      id === 'water' ? (
                        <TileAction
                          icon={SlidersHorizontal}
                          label={t('quick.water.options')}
                          onPress={() => {
                            touch()
                            setSheet({ kind: 'counter', counter: 'hydration_ml' })
                          }}
                        />
                      ) : undefined
                    }
                  />
                ) : null
              })}
              <QuickTile
                icon={Ellipsis}
                label={t('quick.tile.more')}
                value={<Word>{t('quick.more.tileValue')}</Word>}
                caption={t('quick.more.tileHint')}
                dot={hiddenIds.some(asking)}
                ariaLabel={`${t('quick.tile.more')}. ${t('quick.more.tileHint')}`}
                onPress={() => {
                  touch()
                  setSheet({ kind: 'more' })
                }}
              />
            </>
          )}
        </div>
      </div>

      <LogDoseSheet
        // A tile for another protocol switches the sheet to it.
        key={`dose-${doseKey}`}
        open={sheet?.kind === 'dose'}
        onClose={close}
        protocolId={sheet?.kind === 'dose' ? sheet.protocolId : undefined}
        plannedAt={sheet?.kind === 'dose' ? sheet.plannedAt : undefined}
      />
      <CheckInSheet open={sheet?.kind === 'checkin'} onClose={close} />
      <LogSymptomSheet open={sheet?.kind === 'symptom'} onClose={close} />
      <AddLabSheet open={sheet?.kind === 'lab'} onClose={close} />
      <LogMeasurementSheet
        key={`measure-${sheet?.kind === 'measure' ? sheet.measure : 'closed'}`}
        open={sheet?.kind === 'measure'}
        onClose={close}
        defaultKind={sheet?.kind === 'measure' ? sheet.measure : 'weight'}
      />
      {sheet?.kind === 'body' && <BodyMeasuresSheet onClose={close} />}
      {sheet?.kind === 'counter' && sheet.counter === 'hydration_ml' && (
        <WaterSheet
          counter={data.water}
          goal={goalMl}
          onAdd={(ml) => actions.addAmount('hydration_ml', ml)}
          onRemove={actions.removeRow}
          onClose={close}
        />
      )}
      {sheet?.kind === 'counter' && sheet.counter === 'protein_g' && (
        <ProteinSheet
          counter={data.protein}
          target={data.protein.target}
          perKg={Number(patient?.protein_g_per_kg ?? 1.6)}
          weightKg={data.weight?.value ?? null}
          onAdd={(g) => actions.addAmount('protein_g', g)}
          onRemove={actions.removeRow}
          onClose={close}
        />
      )}
      {sheet?.kind === 'strength' && (
        <StrengthSheet week={data.strength} onSave={actions.saveSession} onClose={close} />
      )}
      {sheet?.kind === 'fasting' && <FastingSheet fastFor={glance.fastFor} onClose={close} />}
      {sheet?.kind === 'more' && <MoreSheet hidden={hidden} onPick={pick} onClose={close} />}
    </section>
  )
}
