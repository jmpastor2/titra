/**
 * The top of "Futuro": the change in weight a published trial observed for the dose the person
 * will be on at the horizon, as one range, and the same range on a scale with the person on it
 * (today, and where his own trend would take him). Without a trial, his own trend is the hero.
 */
import { Card } from '@/components/ui/Card'
import { Segmented, SubstanceDot } from '@/components/ui/primitives'
import { compoundName } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import {
  bandInKg,
  HORIZONS,
  horizonDate,
  isProjection,
  projectTrend,
  type Horizon,
  type PersonalTrend,
} from './outlook'
import type { ProtocolOutlook } from './outlookModel'
import { bandText, type Fmt } from './outlookFormat'
import { PersonalReadout } from './PersonalBlock'
import { TrialScaleBar } from './TrialScaleBar'
import { trialScale } from './trialScale'

export function HorizonPicker({
  f,
  value,
  onChange,
}: {
  f: Fmt
  value: Horizon
  onChange: (h: Horizon) => void
}) {
  return (
    <Segmented<string>
      size="sm"
      value={String(value)}
      onChange={(v) => onChange(Number(v) as Horizon)}
      options={HORIZONS.map((h) => ({
        value: String(h),
        label: f.t('outlook.horizon.months', { n: h }),
      }))}
    />
  )
}

export function Headline({
  f,
  horizon,
  onHorizon,
  now,
  trials,
  trend,
  readOnly = true,
  onLogWeight,
}: {
  f: Fmt
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  now: Date
  trials: readonly ProtocolOutlook[]
  trend: PersonalTrend | null
  readOnly?: boolean
  onLogWeight?: () => void
}) {
  const { t } = f
  const [first, ...rest] = trials
  const target = first?.trial?.ref.targetDate ?? horizonDate(now, horizon)
  const projection = projectTrend(trend, target)
  return (
    <Card className="p-4">
      <HorizonPicker f={f} value={horizon} onChange={onHorizon} />
      <div className="spec mt-4">
        {t('outlook.hero.label', { n: horizon })} · {f.date(target)}
      </div>

      {first ? (
        <HeadlineTrial
          f={f}
          item={first}
          big
          weightKg={trend?.baseline.kg ?? null}
          youPct={trend?.changePct ?? null}
          projection={
            isProjection(projection)
              ? { pct: projection.deltaPct, weak: projection.reliability === 'weak' }
              : null
          }
        />
      ) : (
        <div className="mt-2">
          <div className="text-[13px] font-semibold text-ink-2">{t('outlook.headline.you')}</div>
          <PersonalReadout f={f} trend={trend} projection={projection} />
        </div>
      )}

      {!trend && !readOnly && onLogWeight && (
        <button
          type="button"
          onClick={onLogWeight}
          className="tap-link mt-1 block text-left text-[13px] font-semibold text-signal outline-none focus-visible:underline"
        >
          {first ? t('outlook.scale.logWeight') : t('outlook.personal.logWeight')}
        </button>
      )}

      {rest.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-3">
          {rest.map((item) => (
            <HeadlineTrial key={item.row.id} f={f} item={item} />
          ))}
        </div>
      )}
    </Card>
  )
}

/**
 * The trial band of a protocol at the horizon. `big` is the one number the page is about, with
 * its scale; the rest are single lines. `weightKg` turns the band into kilos on the person's
 * starting weight, `youPct` puts him on the scale.
 */
export function HeadlineTrial({
  f,
  item,
  big = false,
  weightKg = null,
  youPct = null,
  projection = null,
  compactScale = false,
}: {
  f: Fmt
  item: ProtocolOutlook
  big?: boolean
  weightKg?: number | null
  youPct?: number | null
  projection?: { pct: number; weak: boolean } | null
  /** A scale without its legend, for the summary card on Progress. */
  compactScale?: boolean
}) {
  const { t } = f
  const trial = item.trial
  if (!trial) return null
  const { band, next, timepoint } = trial.ref
  const name = compoundName(trial.compoundId)
  const color = compoundColor(trial.compoundId)
  const nameLine = (
    <span className="flex min-w-0 items-start gap-1.5">
      <span className="mt-[6px] flex">
        <SubstanceDot color={color} />
      </span>
      <span className="min-w-0 text-[15px] font-semibold leading-snug">{name}</span>
    </span>
  )
  const later = next
    ? t('outlook.band.firstAt', {
        week: next.timepoint.week,
        date: next.date ? f.date(next.date) : '—',
      })
    : t('outlook.band.none')
  const kg = band && weightKg !== null ? bandInKg(weightKg, band) : null
  const scale =
    big || compactScale
      ? trialScale({
          band,
          placeboPct: band?.placeboPct ?? null,
          youPct,
          projectionPct: projection?.pct ?? null,
        })
      : null
  const bandLabel = timepoint ? t('outlook.scale.band', { week: timepoint.week }) : ''

  if (big || compactScale) {
    return (
      <div className={big ? 'mt-2' : undefined}>
        {nameLine}
        {band ? (
          <div
            className={
              big
                ? 'readout mt-2 text-[36px] font-semibold leading-none text-ink'
                : 'readout mt-1.5 text-[26px] font-semibold leading-none text-ink'
            }
          >
            {bandText(f, band.lowerPct, band.upperPct, 0)}
          </div>
        ) : (
          <div className="mt-2 text-[17px] font-semibold">{t('outlook.band.noneShort')}</div>
        )}
        {kg && weightKg !== null ? (
          <p className="readout mt-2 text-[12.5px] leading-snug text-muted">
            {t('outlook.headline.kg', {
              range: f.range(f.weightDelta(kg.lowerKg), f.weightDelta(kg.upperKg)),
              weight: f.weight(weightKg),
            })}
          </p>
        ) : (
          (!band || !big) && (
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted">
              {band ? bandLabel : later}
            </p>
          )
        )}
        {scale && (
          <TrialScaleBar
            f={f}
            scale={scale}
            color={color}
            you={youPct}
            projection={projection}
            bandLabel={bandLabel}
            legend={big}
            className={big ? 'mt-4' : 'mt-3'}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        {nameLine}
        {band ? (
          <span className="readout shrink-0 text-[20px] font-semibold leading-snug">
            {bandText(f, band.lowerPct, band.upperPct, 0)}
          </span>
        ) : (
          <span className="shrink-0 text-right text-[12.5px] text-muted">
            {t('outlook.band.noneShort')}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[12px] leading-snug text-muted">
        {band && timepoint ? t('outlook.scale.band', { week: timepoint.week }) : later}
      </p>
    </div>
  )
}
