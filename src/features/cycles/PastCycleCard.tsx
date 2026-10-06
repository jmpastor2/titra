import { addDays } from 'date-fns'
import { Repeat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { CompareBlock, CycleFigures } from './CycleFigures'
import { useCycleText } from './cycleText'
import { doseLabel } from './doseLabel'
import { cycleCompoundIds, STATUS_TONE, type CycleView } from './model'
import { retrospective } from './stats'
import type { CycleEntry } from './useCyclesData'

/**
 * A cycle that is over, in brief: when it ran and for how long, how the doses went, how
 * weight moved, the dose it ended on and how it compares with the cycle before.
 */
export function PastCycleCard({
  entry,
  now,
  vials,
  statsState,
  imperial,
  onNewCycle,
}: {
  entry: CycleEntry
  now: Date
  vials: readonly InventoryRow[]
  statsState: 'pending' | 'ready' | 'error'
  imperial: boolean
  onNewCycle: (view: CycleView) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const { view, stats, comparison, canContinue } = entry
  const { row } = view
  const retro = retrospective(view, now)
  const date = (d: Date) => fmtDate(d, locale, 'd MMM yyyy')
  const lastDose =
    retro.lastDoseMg !== null
      ? doseLabel({ like: view.like, doseMg: retro.lastDoseMg, vials, locale, withUnits: false })
          .full
      : null

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-1.5">
              <span className="flex shrink-0 items-center gap-1 pt-[7px]">
                {cycleCompoundIds(view).map((id) => (
                  <SubstanceDot key={id} color={compoundColor(id)} />
                ))}
              </span>
              <h3 className="break-words font-display text-[16px] font-semibold leading-snug">
                {row.name}
              </h3>
            </div>
            {view.siblings > 1 && (
              <div className="spec mt-1">{t('cycles.cycleN', { n: view.ordinal })}</div>
            )}
          </div>
          <Badge tone={STATUS_TONE[row.status]}>{t(`protocols.statuses.${row.status}`)}</Badge>
        </header>

        <p className="readout mt-2 text-[12.5px] text-ink-2">
          {t('cycles.past.range', {
            from: date(retro.startsOn),
            to: date(addDays(retro.stopsOn, -1)),
          })}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {text.span(retro.weeks, retro.doseWeeks, retro.restWeeks)}
          {retro.early && ` · ${t('cycles.past.early')}`}
        </p>

        <div className="mt-3.5">
          <CycleFigures stats={stats} state={statsState} imperial={imperial} lastDose={lastDose} />
        </div>
      </div>

      {comparison && <CompareBlock comparison={comparison} imperial={imperial} />}

      {canContinue && (
        <div className="border-t border-line px-4 py-3">
          <Button
            block
            variant="soft"
            leading={<Repeat className="size-4" />}
            onClick={() => onNewCycle(view)}
          >
            {t('cycles.new.cta')}
          </Button>
        </div>
      )}
    </Card>
  )
}
