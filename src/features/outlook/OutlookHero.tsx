/**
 * The top of "Futuro": what the trial observed for the dose the person will be on at the horizon,
 * as one range, and below it where his own weight trend would go if it went straight on.
 */
import { Card } from '@/components/ui/Card'
import { Badge, Segmented, SubstanceDot } from '@/components/ui/primitives'
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
}: {
  f: Fmt
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  now: Date
  trials: readonly ProtocolOutlook[]
  trend: PersonalTrend | null
}) {
  const { t } = f
  const [first, ...rest] = trials
  const target = first?.trial?.ref.targetDate ?? horizonDate(now, horizon)
  const projection = projectTrend(trend, target)
  return (
    <Card instrument className="p-5">
      <HorizonPicker f={f} value={horizon} onChange={onHorizon} />
      <div className="spec mt-5">
        {t('outlook.headline.expected', { n: horizon })} · {f.date(target)}
      </div>

      {first && <HeadlineTrial f={f} item={first} big weightKg={trend?.baseline.kg ?? null} />}
      {rest.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-3">
          {rest.map((item) => (
            <HeadlineTrial key={item.row.id} f={f} item={item} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink-2">{t('outlook.headline.you')}</div>
          {isProjection(projection) && (
            <Badge
              tone={projection.reliability === 'weak' ? 'warn' : 'neutral'}
              className="mt-1.5 whitespace-normal! text-left leading-snug"
            >
              {projection.reliability === 'weak'
                ? t('outlook.personal.badgeWeak')
                : t('outlook.personal.badge')}
            </Badge>
          )}
        </div>
        {isProjection(projection) ? (
          <div className="shrink-0 text-right">
            <div className="readout text-[20px] font-semibold leading-none text-ink">
              {f.weightDelta(projection.deltaKg)}
            </div>
            <div className="readout mt-1.5 text-[12px] leading-none text-muted">
              {f.pct(projection.deltaPct)}
            </div>
          </div>
        ) : (
          <span className="max-w-[48%] text-right text-[12.5px] leading-snug text-muted">
            {t(`outlook.personal.short.${projection.none}`)}
          </span>
        )}
      </div>
      {isProjection(projection) && projection.reliability === 'weak' && (
        <p className="mt-2 text-[11.5px] leading-snug text-muted">{t('outlook.personal.weak')}</p>
      )}
    </Card>
  )
}

/**
 * The trial band of a protocol at the horizon. `big` is the one number the page is about; the
 * rest are single lines. `weightKg` turns the band into kilos on the person's starting weight.
 */
export function HeadlineTrial({
  f,
  item,
  big = false,
  weightKg = null,
}: {
  f: Fmt
  item: ProtocolOutlook
  big?: boolean
  weightKg?: number | null
}) {
  const { t } = f
  const trial = item.trial
  if (!trial) return null
  const { band, next, timepoint } = trial.ref
  const name = compoundName(trial.compoundId)
  const nameLine = (
    <span className="flex min-w-0 items-start gap-1.5">
      <span className="mt-[6px] flex">
        <SubstanceDot color={compoundColor(trial.compoundId)} />
      </span>
      <span className="min-w-0 text-[15px] font-semibold leading-snug">{name}</span>
    </span>
  )
  const note =
    band && timepoint
      ? t('outlook.headline.bandNote', { week: timepoint.week })
      : next
        ? t('outlook.band.firstAt', {
            week: next.timepoint.week,
            date: next.date ? f.date(next.date) : '—',
          })
        : t('outlook.band.none')
  const kg = band && weightKg !== null ? bandInKg(weightKg, band) : null

  if (big) {
    return (
      <div className="mt-3">
        {nameLine}
        {band ? (
          <div className="readout mt-2 text-[34px] font-semibold leading-none text-glow">
            {bandText(f, band.lowerPct, band.upperPct, 0)}
          </div>
        ) : (
          <div className="mt-2 text-[17px] font-semibold">{t('outlook.band.noneShort')}</div>
        )}
        <p className="mt-2 text-[12px] leading-snug text-muted">{note}</p>
        {kg && weightKg !== null && (
          <p className="readout mt-1 text-[12.5px] text-ink-2">
            {t('outlook.headline.kg', {
              range: f.range(f.weightDelta(kg.lowerKg), f.weightDelta(kg.upperKg)),
              weight: f.weight(weightKg),
            })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        {nameLine}
        {band ? (
          <span className="readout shrink-0 text-[20px] font-semibold leading-snug text-glow">
            {bandText(f, band.lowerPct, band.upperPct, 0)}
          </span>
        ) : (
          <span className="shrink-0 text-right text-[12.5px] text-muted">
            {t('outlook.band.noneShort')}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[12px] leading-snug text-muted">{note}</p>
    </div>
  )
}
