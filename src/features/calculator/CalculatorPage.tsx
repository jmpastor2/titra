import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Syringe } from '@/components/dosing/Syringe'
import { Kpi } from '@/components/kpi/Kpi'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
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

  const waterNum = Number(diluentMl.replace(',', '.'))
  const waterUnits = waterNum > 0 ? waterNum * 100 : null

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
      <PageHeader
        eyebrow={t('calculator.eyebrow')}
        title={t('calculator.pageTitle')}
        back="/more"
      />

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
            <p className="mb-4 text-[13px] leading-snug text-muted">{t('calculator.intro')}</p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 items-start gap-3">
                <Field label={t('calculator.vialMg')}>
                  {(id) => (
                    <Input
                      id={id}
                      inputMode="decimal"
                      value={vialMg}
                      onChange={(e) => setVialMg(e.target.value)}
                      suffix="mg"
                      className="readout"
                    />
                  )}
                </Field>
                <Field
                  label={t('calculator.diluentMl')}
                  // The same water as the syringe counts it: 100 U = 1 mL.
                  hint={
                    waterUnits === null ? undefined : (
                      <span className="readout">= {fmtNumber(waterUnits, locale, 0)} U</span>
                    )
                  }
                >
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      inputMode="decimal"
                      value={diluentMl}
                      onChange={(e) => setDiluentMl(e.target.value)}
                      suffix="mL"
                      className="readout"
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
                    className="readout text-[18px] font-semibold"
                  />
                )}
              </Field>
              <Button variant="secondary" size="sm" className="self-start" onClick={suggest}>
                {t('calculator.suggest', { units: 10 })}
              </Button>
            </div>
          </Card>

          {result ? (
            <Card>
              <Kpi
                label={t('calculator.unitsRounded')}
                value={fmtNumber(result.draw.unitsRounded, locale, 1)}
                unit="U"
                size="lg"
                tone="signal"
                caption={t('calculator.drawCaption', {
                  ml: fmtNumber(result.draw.volumeMl, locale, 3),
                  dose: fmtNumber(result.draw.actualDoseMcg, locale, 1),
                })}
              />
              <Syringe
                capacity={barrel.capacity}
                loads={[{ from: 0, to: result.draw.unitsRounded, color: 'var(--signal)' }]}
                label={t('draw.aria', {
                  capacity: barrel.capacity,
                  units: fmtNumber(result.draw.unitsRounded, locale, 1),
                })}
                className="mt-3 w-full"
              />
              <p className="mt-1 text-center text-[12px] text-muted">
                {t('calculator.syringe', { ml: fmtNumber(barrel.capacity / 100, locale, 1) })}
              </p>
              {result.draw.unitsRounded > 100 && (
                <p className="mt-1 text-center text-[12.5px] font-medium text-warn">
                  {t('draw.notFits')}
                </p>
              )}
              <dl className="mt-4 grid grid-cols-3 gap-x-3 border-t border-line pt-4">
                <Fact
                  label={t('calculator.concentration')}
                  value={fmtNumber(result.rec.concentrationMgPerMl, locale, 3)}
                  unit="mg/mL"
                />
                <Fact
                  label={t('calculator.perUnit')}
                  value={fmtNumber(result.rec.mcgPerUnit, locale, 1)}
                  unit="mcg/U"
                />
                <Fact
                  label={t('calculator.dosesPerVial')}
                  value={String(result.draw.dosesPerVial)}
                />
              </dl>
            </Card>
          ) : (
            <EmptyResult text={t('calculator.empty')} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('doses.dose')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={penDoseMg}
                    onChange={(e) => setPenDoseMg(e.target.value)}
                    suffix="mg"
                    className="readout"
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
                    className="readout"
                  />
                )}
              </Field>
            </div>
          </Card>
          {pen ? (
            <Card>
              <Kpi
                label={t('calculator.penClicks')}
                value={String(pen.clicks)}
                unit={t('calculator.clicks')}
                size="lg"
                tone="signal"
                caption={t('calculator.penCaption', { dose: fmtNumber(pen.actualMg, locale, 4) })}
              />
            </Card>
          ) : (
            <EmptyResult text={t('calculator.emptyPen')} />
          )}
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 px-1 text-[12.5px] leading-snug text-muted">
        <AlertTriangle className="mt-px size-4 shrink-0 text-warn" aria-hidden />
        {t('calculator.warning')}
      </p>
    </div>
  )
}

/** One reading of the result: quiet label, rounded number, unit. */
function Fact({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0">
      <dt className="spec leading-snug">{label}</dt>
      <dd className="readout mt-1 text-[17px] font-semibold leading-tight">
        {value}
        {unit && <span className="block font-sans text-[12px] font-medium text-muted">{unit}</span>}
      </dd>
    </div>
  )
}

/** Where the result goes while a field is empty or zero: the card stays, with what it needs. */
function EmptyResult({ text }: { text: string }) {
  return (
    <Card>
      <p className="text-[13.5px] leading-snug text-muted">{text}</p>
    </Card>
  )
}
