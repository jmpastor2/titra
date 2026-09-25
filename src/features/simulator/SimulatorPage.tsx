import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { subDays } from 'date-fns'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Field'
import { EmptyState, Segmented, Stat } from '@/components/ui/primitives'
import { compoundById, PK_COMPOUNDS } from '@/content/compounds'
import { templatesForCompound } from '@/content/protocols/templates'
import { exposureCurve, washoutHours } from '@/domain/pk/engine'
import { projectPlanned, projectSkipNext, projectStop, projectSwitch } from '@/domain/pk/scenarios'
import type { ProtocolLike } from '@/domain/types'
import { PkChart } from '@/features/exposure/PkChart'
import { useExposure } from '@/features/exposure/useExposure'
import { fmtHours, fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

type Scenario = 'planned' | 'skip_next' | 'stop' | 'switch'

export function SimulatorPage() {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const { patientId } = usePatientScope()
  const now = useMemo(() => new Date(), [])
  const exposure = useExposure(patientId, now)

  const [compoundId, setCompoundId] = useState<string>('')
  const [scenario, setScenario] = useState<Scenario>('skip_next')
  const [horizon, setHorizon] = useState<'30' | '60' | '90' | '180'>('60')
  const horizonDays = Number(horizon)
  const [switchTo, setSwitchTo] = useState<string>('tirzepatide')
  const [switchTemplateId, setSwitchTemplateId] = useState<string>('')

  // Only substances with human PK data can be simulated (MOTS-c or Mod GRF cannot);
  // long-acting ones first, where skipping or stopping matters most.
  const simulable = exposure.items
    .filter((x) => x.pk)
    .toSorted((a, b) => b.pk!.halfLifeH - a.pk!.halfLifeH)
  const current = simulable.find((x) => x.compoundId === compoundId) ?? simulable[0]
  const pk = current?.pk

  const history = useMemo(() => {
    if (!current || !pk) return []
    return exposureCurve(current.history, pk, {
      from: subDays(now, 28),
      to: now,
      stepH: 4,
      refineAtDoses: true,
    })
  }, [current, pk, now])

  const switchTemplate = useMemo(() => {
    const tpls = templatesForCompound(switchTo)
    return tpls.find((x) => x.id === switchTemplateId) ?? tpls[0]
  }, [switchTo, switchTemplateId])

  const result = useMemo(() => {
    if (!current || !pk) return null
    const base = {
      compoundId: current.compoundId,
      pk,
      history: current.history,
      protocol: current.protocolLike,
      now,
      horizonDays,
      stepH: 4,
    }
    if (scenario === 'planned') return { main: projectPlanned(base), alt: null }
    if (scenario === 'skip_next') return { main: projectPlanned(base), alt: projectSkipNext(base) }
    if (scenario === 'stop') return { main: projectPlanned(base), alt: projectStop(base) }

    const target = compoundById(switchTo)
    if (!target?.pk || !switchTemplate) return { main: projectPlanned(base), alt: null }
    const protocol: ProtocolLike = {
      compoundId: switchTo,
      startDate: toDateInputValue(now),
      steps: switchTemplate.steps,
      times: ['09:00'],
    }
    const [from, to] = projectSwitch({
      from: { compoundId: current.compoundId, pk, history: current.history },
      to: { compoundId: switchTo, pk: target.pk, protocol },
      switchAt: now,
      now,
      horizonDays,
      stepH: 4,
    })
    return { main: from, alt: to }
  }, [current, pk, scenario, horizonDays, now, switchTo, switchTemplate])

  const insight = useMemo(() => {
    if (!result || !pk) return null
    if (scenario === 'skip_next' && result.alt) {
      const min = Math.min(...result.alt.points.map((p) => p.mg))
      return { label: t('simulator.levelAfterSkip'), value: `${fmtNumber(min, locale, 2)} mg` }
    }
    if (scenario === 'stop') {
      return { label: t('simulator.washout'), value: fmtHours(washoutHours(0.1, pk), locale) }
    }
    return null
  }, [result, scenario, pk, t, locale])

  if (exposure.isPending) return <div className="pt-6" />

  if (!current || !pk) {
    return (
      <div>
        <PageHeader title={t('simulator.title')} back="/more" />
        <Card>
          <EmptyState
            title={t('simulator.needProtocol')}
            description={t('dashboard.noProtocolHint')}
          />
        </Card>
      </div>
    )
  }

  const altLabel =
    scenario === 'skip_next'
      ? t('simulator.skipNext')
      : scenario === 'stop'
        ? t('simulator.stop')
        : scenario === 'switch'
          ? compoundById(switchTo)?.names.generic
          : undefined

  return (
    <div className="pb-6">
      <PageHeader title={t('simulator.title')} subtitle={t('simulator.intro')} back="/more" />

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
          size="sm"
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
                value={switchTo}
                onChange={(e) => {
                  setSwitchTo(e.target.value)
                  setSwitchTemplateId('')
                }}
              >
                {PK_COMPOUNDS.filter((c) => c.id !== current.compoundId).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.names.generic}
                  </option>
                ))}
              </Select>
              {templatesForCompound(switchTo).length > 0 && (
                <>
                  <label className="text-[13px] font-medium text-ink-2">
                    {t('simulator.switchTemplate')}
                  </label>
                  <Select
                    value={switchTemplateId}
                    onChange={(e) => setSwitchTemplateId(e.target.value)}
                  >
                    {templatesForCompound(switchTo).map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {pick(tpl.name)}
                      </option>
                    ))}
                  </Select>
                </>
              )}
            </div>
          </Card>
        )}

        <Card title={t('dashboard.curve')} subtitle={t('dashboard.curveHint')}>
          {result && (
            <PkChart
              history={history}
              projection={result.main.points}
              alt={result.alt?.points}
              altLabel={altLabel}
              doses={current.history}
              now={now}
              height={250}
            />
          )}
          <div className="mt-1 flex flex-wrap items-center gap-4 px-2 text-[11.5px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-4 rounded bg-[var(--chart-1)]" />
              {scenario === 'switch' ? current.compound?.names.generic : t('simulator.planned')}
            </span>
            {result?.alt && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-[2px] w-4 rounded bg-[var(--chart-2)]" />
                {altLabel}
              </span>
            )}
          </div>
        </Card>

        <Card title={t('simulator.horizon')}>
          <Segmented<'30' | '60' | '90' | '180'>
            value={horizon}
            onChange={setHorizon}
            size="sm"
            options={[
              { value: '30', label: t('common.range.30') },
              { value: '60', label: '60 d' },
              { value: '90', label: t('common.range.90') },
              { value: '180', label: t('common.range.180') },
            ]}
          />
          {insight && (
            <div className="mt-4">
              <Stat
                label={insight.label}
                value={insight.value}
                tone="accent"
                hint={t('simulator.washoutHint')}
              />
            </div>
          )}
        </Card>

        <p className="px-2 text-center text-[11px] leading-relaxed text-muted">
          {t('app.disclaimer')}
        </p>
      </div>
    </div>
  )
}
