import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Syringe } from '@/components/dosing/Syringe'
import { Segmented } from '@/components/ui/primitives'
import { syringeFor } from '@/domain/dosing/draw'
import { drawUp, penClicks, reconstitute, suggestDiluentMl } from '@/domain/dosing/reconstitution'
import { fmtNumber } from '@/lib/format'
import { barrelFor, useSyringePref } from '@/lib/syringePref'
import { useLocale } from '@/lib/useLocale'

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

  const syringePref = useSyringePref()
  const barrel = barrelFor(
    syringePref,
    result?.draw.unitsRounded ?? 0,
    syringeFor(result?.draw.unitsRounded ?? 0),
  )

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
              <Card tone="signal">
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

              <Card eyebrow={`U-100 · ${fmtNumber(barrel.capacity / 100, locale, 1)} mL`}>
                <div className="readout text-glow text-[30px] font-semibold leading-none text-signal">
                  {fmtNumber(result.draw.unitsRounded, locale, 1)}
                  <span className="ml-1 text-[14px]">U</span>
                </div>
                <Syringe
                  capacity={barrel.capacity}
                  loads={[{ from: 0, to: result.draw.unitsRounded, color: 'var(--signal)' }]}
                  label={t('draw.aria', {
                    capacity: barrel.capacity,
                    units: fmtNumber(result.draw.unitsRounded, locale, 1),
                  })}
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-center text-[11.5px] text-muted">
                  {t('calculator.unitsRounded')}
                  {result.draw.unitsRounded > 100 ? ` · ${t('draw.notFits')}` : ''}
                </p>
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
            <Card tone="signal">
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
