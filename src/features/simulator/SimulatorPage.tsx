import { subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Delta, Kpi } from '@/components/kpi/Kpi'
import { Meter } from '@/components/kpi/Meter'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Field'
import { EmptyState, Segmented, Skeleton } from '@/components/ui/primitives'
import { PK_COMPOUNDS } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { templatesForCompound } from '@/content/protocols/templates'
import { plannedDoses } from '@/domain/dosing/schedule'
import { amountAt, exposureCurve, rateConstants } from '@/domain/pk/engine'
import { projectPlanned, projectSkipNext, projectStop, projectSwitch } from '@/domain/pk/scenarios'
import type { ProtocolLike } from '@/domain/types'
import { amountIn } from '@/features/exposure/chartScale'
import { curveStepH, curveToNow } from '@/features/exposure/curves'
import { hasMeaningfulCurve } from '@/features/exposure/levelSummary'
import { PkChart } from '@/features/exposure/PkChart'
import { useExposure } from '@/features/exposure/useExposure'
import { fmtHours, fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { scenarioInsight, type Scenario } from './insight'

type Horizon = '30' | '60' | '90' | '180'
const HORIZONS: readonly Horizon[] = ['30', '60', '90', '180']
const HISTORY_DAYS = 28

export function SimulatorPage() {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const { patientId } = usePatientScope()
  const clock = useNow()
  const exposure = useExposure(patientId, clock)
  const now = exposure.now

  const [compoundId, setCompoundId] = useState<string>('')
  const [scenario, setScenario] = useState<Scenario>('skip_next')
  const [horizon, setHorizon] = useState<Horizon>('60')
  const horizonDays = Number(horizon)
  const [switchTo, setSwitchTo] = useState<string>('tirzepatide')
  const [switchTemplateId, setSwitchTemplateId] = useState<string>('')

  // Only substances whose level is worth a curve can be simulated: long-acting injectables
  // with human data. Short-acting pulses (ipamorelin) or MOTS-c have no level to project.
  const simulable = useMemo(
    () =>
      exposure.items
        .filter((x) => hasMeaningfulCurve(x.pk) && x.nowMg !== null && !x.partnerOf)
        .toSorted((a, b) => (b.pk?.halfLifeH ?? 0) - (a.pk?.halfLifeH ?? 0)),
    [exposure.items],
  )
  const current = useMemo(
    () => simulable.find((x) => x.compoundId === compoundId) ?? simulable[0],
    [simulable, compoundId],
  )
  const pk = current?.pk
  const unit = current?.compound?.defaultUnit ?? 'mg'
  const color = compoundColor(current?.compoundId ?? '')

  const targets = useMemo(
    () => PK_COMPOUNDS.filter((c) => c.id !== current?.compoundId && hasMeaningfulCurve(c.pk)),
    [current?.compoundId],
  )
  const target = targets.find((c) => c.id === switchTo) ?? targets[0]
  const switchTemplate = useMemo(() => {
    const tpls = templatesForCompound(target?.id ?? '')
    return tpls.find((x) => x.id === switchTemplateId) ?? tpls[0]
  }, [target?.id, switchTemplateId])

  const history = useMemo(() => {
    if (!current || !pk) return []
    const from = subDays(now, HISTORY_DAYS)
    return curveToNow(
      exposureCurve(current.history, pk, {
        from,
        to: now,
        stepH: curveStepH(HISTORY_DAYS),
        refineAtDoses: true,
      }),
      now,
      amountAt(current.history, now, rateConstants(pk)),
    )
  }, [current, pk, now])

  const result = useMemo(() => {
    if (!current || !pk) return null
    const base = {
      compoundId: current.compoundId,
      pk,
      history: current.history,
      protocol: current.protocolLike,
      now,
      horizonDays,
      stepH: curveStepH(horizonDays),
    }
    if (scenario === 'planned') return { main: projectPlanned(base), alt: null }
    if (scenario === 'skip_next') return { main: projectPlanned(base), alt: projectSkipNext(base) }
    if (scenario === 'stop') return { main: projectPlanned(base), alt: projectStop(base) }

    if (!target?.pk || !switchTemplate) return { main: projectPlanned(base), alt: null }
    const protocol: ProtocolLike = {
      compoundId: target.id,
      startDate: toDateInputValue(now),
      steps: switchTemplate.steps,
      times: ['09:00'],
    }
    const [from, to] = projectSwitch({
      from: { compoundId: current.compoundId, pk, history: current.history },
      to: { compoundId: target.id, pk: target.pk, protocol },
      switchAt: now,
      now,
      horizonDays,
      stepH: base.stepH,
    })
    return { main: from, alt: to }
  }, [current, pk, scenario, horizonDays, now, target, switchTemplate])

  // The administrations the plan has ahead, and the one the "skip" tab leaves out.
  const upcoming = useMemo(() => {
    if (!current?.protocolLike || scenario === 'stop' || scenario === 'switch') return []
    const to = new Date(now.getTime() + horizonDays * 86_400_000)
    return plannedDoses(current.protocolLike, current.history, now, to).map((p) => ({
      at: p.at,
      mg: p.doseMg,
    }))
  }, [current, scenario, now, horizonDays])

  const insight = useMemo(
    () =>
      result && pk
        ? scenarioInsight(scenario, pk, result.main.points, result.alt?.points ?? null)
        : null,
    [result, scenario, pk],
  )

  if (exposure.isPending) {
    // The shape of the page, so nothing moves when the data arrives.
    return (
      <div className="pb-6">
        <PageHeader title={t('simulator.title')} back="/more" />
        <div className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-[330px] w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!current || !pk) {
    const hasAny = exposure.items.length > 0
    return (
      <div>
        <PageHeader title={t('simulator.title')} back="/more" />
        <Card>
          <EmptyState
            title={t('simulator.needProtocol')}
            description={hasAny ? t('simulator.onlyLongActing') : t('dashboard.noProtocolHint')}
          />
        </Card>
      </div>
    )
  }

  const altColor = scenario === 'switch' && target ? compoundColor(target.id) : 'var(--ink-2)'
  const altLabel =
    scenario === 'skip_next'
      ? t('simulator.skipNext')
      : scenario === 'stop'
        ? t('simulator.stop')
        : scenario === 'switch'
          ? target?.names.generic
          : undefined
  const amountParts = (mg: number) => {
    const a = amountIn(mg, unit)
    return { value: fmtNumber(a.value, locale, a.digits), unit: a.label }
  }
  const fmtAmount = (mg: number) => {
    const a = amountParts(mg)
    return `${a.value} ${a.unit}`
  }

  return (
    <div className="pb-6">
      <PageHeader title={t('simulator.title')} back="/more" />
      <p className="-mt-2 mb-4 px-1 text-[13.5px] leading-snug text-muted">
        {t('simulator.intro')}
      </p>

      <div className="flex flex-col gap-3">
        {simulable.length > 1 && (
          <Select value={current.compoundId} onChange={(e) => setCompoundId(e.target.value)}>
            {simulable.map((x) => (
              <option key={x.compoundId} value={x.compoundId}>
                {x.compound?.names.generic ?? x.compoundId}
              </option>
            ))}
          </Select>
        )}

        <Segmented<Scenario>
          value={scenario}
          onChange={setScenario}
          options={[
            { value: 'skip_next', label: t('simulator.tabSkip') },
            { value: 'stop', label: t('simulator.tabStop') },
            { value: 'switch', label: t('simulator.tabSwitch') },
          ]}
        />

        {scenario === 'switch' && (
          <Card>
            <div className="flex flex-col gap-3">
              <label className="text-[13px] font-medium text-ink-2">
                {t('simulator.switchTo')}
              </label>
              <Select
                value={target?.id ?? ''}
                onChange={(e) => {
                  setSwitchTo(e.target.value)
                  setSwitchTemplateId('')
                }}
              >
                {targets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.names.generic}
                  </option>
                ))}
              </Select>
              {templatesForCompound(target?.id ?? '').length > 0 && (
                <>
                  <label className="text-[13px] font-medium text-ink-2">
                    {t('simulator.switchTemplate')}
                  </label>
                  <Select
                    value={switchTemplate?.id ?? ''}
                    onChange={(e) => setSwitchTemplateId(e.target.value)}
                  >
                    {templatesForCompound(target?.id ?? '').map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {pick(tpl.name)}
                      </option>
                    ))}
                  </Select>
                  {switchTemplate && (
                    <p className="-mt-1 text-[12.5px] leading-snug text-muted">
                      {pick(switchTemplate.name)}
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        )}

        {insight && (
          <Card>
            {insight.kind === 'skip' && (
              <SkipInsight
                lowest={amountParts(insight.lowestMg)}
                plan={fmtAmount(insight.planLowestMg)}
                share={insight.planLowestMg > 0 ? insight.lowestMg / insight.planLowestMg : null}
                color={color}
              />
            )}
            {insight.kind === 'stop' && (
              <Kpi
                label={t('simulator.washout')}
                value={fmtHours(insight.washoutH, locale)}
                caption={t('simulator.washoutHint')}
              />
            )}
          </Card>
        )}

        <Card title={t('simulator.chartTitle')} subtitle={t('simulator.chartHint')}>
          {result && (
            <PkChart
              history={history}
              projection={result.main.points}
              alt={result.alt?.points}
              altLabel={altLabel}
              altColor={altColor}
              doses={current.history}
              planned={scenario === 'skip_next' ? upcoming.slice(1) : upcoming}
              crossed={scenario === 'skip_next' ? upcoming.slice(0, 1) : undefined}
              now={now}
              color={color}
              unit={unit}
              height={250}
              label={t('simulator.chartAria')}
            />
          )}
          <ul className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11.5px] text-muted">
            <li className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-4 rounded" style={{ background: color }} />
              {scenario === 'switch' ? current.compound?.names.generic : t('simulator.planned')}
            </li>
            {result?.alt && (
              <li className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-4 border-t-2 border-dotted"
                  style={{ borderColor: altColor }}
                />
                {altLabel}
              </li>
            )}
            {scenario === 'skip_next' && upcoming.length > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <path
                    d="M1.5 1.5l7 7m-7 0l7-7"
                    stroke={altColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {t('simulator.skipped')}
              </li>
            )}
          </ul>
          <div className="mt-3">
            <div className="spec mb-1.5">{t('simulator.horizon')}</div>
            <Segmented<Horizon>
              value={horizon}
              onChange={setHorizon}
              options={HORIZONS.map((h) => ({ value: h, label: t('simulator.days', { n: h }) }))}
            />
          </div>
        </Card>

        <p className="px-2 text-center text-[11px] leading-relaxed text-muted">
          {t('app.disclaimer')}
        </p>
      </div>
    </div>
  )
}

/**
 * What skipping the next dose does to the lowest level ahead: the figure, how far below the
 * plan's lowest it falls, and a bar of how much of that lowest level is left.
 */
function SkipInsight({
  lowest,
  plan,
  share,
  color,
}: {
  lowest: { value: string; unit: string }
  /** The plan's lowest level, formatted. */
  plan: string
  /** The lowest after skipping against the plan's lowest; null when the plan's is zero. */
  share: number | null
  color: string
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const drop = share === null ? 0 : Math.round((1 - share) * 100)
  return (
    <Kpi
      label={t('simulator.levelAfterSkip')}
      value={lowest.value}
      unit={lowest.unit}
      aside={
        drop > 0 ? (
          <Delta text={`${fmtNumber(drop, locale, 0)} %`} direction="down" tone="neutral" />
        ) : null
      }
      caption={t('simulator.versusPlan', { value: plan })}
    >
      {share !== null && <Meter value={Math.min(1, share)} max={1} color={color} />}
    </Kpi>
  )
}
