import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { drawUp, penClicks, reconstitute, suggestDiluentMl } from '@/domain/dosing/reconstitution'
import { fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { SyringeDiagram } from './SyringeDiagram'

type Mode = 'vial' | 'pen'

export function CalculatorPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [mode, setMode] = useState<Mode>('vial')
  const [vialMg, setVialMg] = useState('5')
  const [diluentMl, setDiluentMl] = useState('2')
  const [doseMcg, setDoseMcg] = useState('250')
  const [penDoseMg, setPenDoseMg] = useState('0.25')
  const [mgPerClick, setMgPerClick] = useState('0.0125')

  const result = useMemo(() => {
    const v = Number(vialMg.replace(',', '.'))
    const d = Number(diluentMl.replace(',', '.'))
    const dose = Number(doseMcg.replace(',', '.'))
    if (!(v > 0) || !(d > 0) || !(dose > 0)) return null
    try {
      const rec = reconstitute(v, d)
      return { rec, draw: drawUp(rec, dose) }
    } catch {
      return null
    }
  }, [vialMg, diluentMl, doseMcg])

  const pen = useMemo(() => {
    const d = Number(penDoseMg.replace(',', '.'))
    const c = Number(mgPerClick.replace(',', '.'))
    if (!(d > 0) || !(c > 0)) return null
    try {
      return penClicks(d, c)
    } catch {
      return null
    }
  }, [penDoseMg, mgPerClick])

  function suggest() {
    const v = Number(vialMg.replace(',', '.'))
    const dose = Number(doseMcg.replace(',', '.'))
    if (!(v > 0) || !(dose > 0)) return
    setDiluentMl(String(Math.round(suggestDiluentMl(v, dose, 10) * 100) / 100))
  }

  return (
    <div className="pb-6">
      <PageHeader title={t('calculator.title')} back="/more" />

      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        className="mb-3"
        options={[
          { value: 'vial', label: t('inventory.forms.vial') },
          { value: 'pen', label: t('inventory.forms.pen') },
        ]}
      />

      {mode === 'vial' ? (
        <div className="flex flex-col gap-3">
          <Card>
            <p className="mb-4 text-[13.5px] leading-relaxed text-muted">{t('calculator.intro')}</p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('calculator.vialMg')}>
                  {(id) => (
                    <Input
                      id={id}
                      inputMode="decimal"
                      value={vialMg}
                      onChange={(e) => setVialMg(e.target.value)}
                      suffix="mg"
                    />
                  )}
                </Field>
                <Field label={t('calculator.diluentMl')}>
                  {(id) => (
                    <Input
                      id={id}
                      inputMode="decimal"
                      value={diluentMl}
                      onChange={(e) => setDiluentMl(e.target.value)}
                      suffix="mL"
                    />
                  )}
                </Field>
              </div>
              <Field label={t('calculator.doseMcg')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={doseMcg}
                    onChange={(e) => setDoseMcg(e.target.value)}
                    suffix="mcg"
                    className="tabular text-[18px] font-semibold"
                  />
                )}
              </Field>
              <Button variant="ghost" size="sm" onClick={suggest}>
                {t('calculator.suggest', { units: 10 })}
              </Button>
            </div>
          </Card>

          {result && (
            <>
              <Card tone="brand">
                <div className="grid grid-cols-2 gap-4">
                  <Result
                    label={t('calculator.concentration')}
                    value={`${fmtNumber(result.rec.concentrationMgPerMl, locale, 3)}`}
                    unit="mg/mL"
                  />
                  <Result
                    label={t('calculator.perUnit')}
                    value={`${fmtNumber(result.rec.mcgPerUnit, locale, 1)}`}
                    unit="mcg/U"
                  />
                  <Result
                    label={t('calculator.unitsRounded')}
                    value={fmtNumber(result.draw.unitsRounded, locale, 1)}
                    unit="U"
                    big
                  />
                  <Result
                    label={t('calculator.actualDose')}
                    value={fmtNumber(result.draw.actualDoseMcg, locale, 1)}
                    unit="mcg"
                    big
                  />
                  <Result
                    label={t('calculator.draw')}
                    value={fmtNumber(result.draw.volumeMl, locale, 3)}
                    unit="mL"
                  />
                  <Result
                    label={t('calculator.dosesPerVial')}
                    value={String(result.draw.dosesPerVial)}
                    unit=""
                  />
                </div>
              </Card>

              <Card>
                <SyringeDiagram units={result.draw.unitsRounded} />
              </Card>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Card title={t('calculator.penClicks')}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('doses.dose')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={penDoseMg}
                    onChange={(e) => setPenDoseMg(e.target.value)}
                    suffix="mg"
                  />
                )}
              </Field>
              <Field label={t('calculator.mgPerClick')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={mgPerClick}
                    onChange={(e) => setMgPerClick(e.target.value)}
                    suffix="mg"
                  />
                )}
              </Field>
            </div>
          </Card>
          {pen && (
            <Card tone="brand">
              <div className="grid grid-cols-2 gap-4">
                <Result label={t('calculator.clicks')} value={String(pen.clicks)} unit="" big />
                <Result
                  label={t('calculator.actualDose')}
                  value={fmtNumber(pen.actualMg, locale, 4)}
                  unit="mg"
                  big
                />
              </div>
            </Card>
          )}
        </div>
      )}

      <Card tone="warn" className="mt-3">
        <div className="flex gap-2.5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" />
          <p className="text-[13px] leading-relaxed">{t('calculator.warning')}</p>
        </div>
      </Card>
    </div>
  )
}

function Result({
  label,
  value,
  unit,
  big,
}: {
  label: string
  value: string
  unit: string
  big?: boolean
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div
        className={
          big ? 'tabular text-[26px] font-bold leading-tight' : 'tabular text-[17px] font-bold'
        }
      >
        {value}
        {unit && <span className="ml-1 text-[12px] font-semibold text-muted">{unit}</span>}
      </div>
    </div>
  )
}
