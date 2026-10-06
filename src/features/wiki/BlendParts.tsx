import { ChevronRight, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Chip, SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import type { BlendInfo, CompoundMeta } from '@/content/schema'
import { categoryColor } from '@/content/substanceColor'
import { fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { blendShares, UNITS_PER_ML } from './blendMath'
import { EvidenceTag } from './EvidenceMeter'
import { Section } from './parts'

const ROW =
  '-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60'

/** What is in the vial: every component with its amount, and why they are sold together. */
export function BlendComponents({ blend }: { blend: BlendInfo }) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const total = blend.components.reduce((sum, p) => sum + p.mg, 0)
  return (
    <Card
      title={t('wiki.blendComponents')}
      subtitle={t('wiki.blendTotal', { total: fmtDose(total, 'mg', locale) })}
    >
      <ul className="divide-y divide-line border-y border-line">
        {blend.components.map((p) => {
          const c = compoundById(p.compoundId)
          if (!c) return null
          return (
            <li key={p.compoundId}>
              <button type="button" onClick={() => nav(`/wiki/${c.id}`)} className={ROW}>
                <SubstanceDot color={categoryColor(c.category)} size={9} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[14.5px] font-semibold leading-snug">
                      {c.names.generic}
                    </span>
                    <span className="readout shrink-0 text-[15px] font-semibold">
                      {fmtDose(p.mg, 'mg', locale)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                    {pick(c.pharmClass)}
                  </span>
                  <EvidenceTag tier={c.evidence} layout="inline" className="mt-2" />
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted/70" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-3.5">
        <Section title={t('wiki.blendWhy')}>{pick(blend.rationale)}</Section>
      </div>
      <p className="mt-3 text-[12.5px] leading-snug text-muted">{t('wiki.blendEvidenceNote')}</p>
    </Card>
  )
}

const DILUENT_OPTIONS_ML = [1, 2, 3, 5] as const
const UNIT_OPTIONS = [5, 10, 20, 30] as const

/** Units drawn -> amount of each component, for a chosen volume of water. */
export function BlendCalculator({ blend }: { blend: BlendInfo }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [diluentMl, setDiluentMl] = useState<number>(blend.exampleDiluentMl ?? 2)
  const [units, setUnits] = useState<number>(10)
  const diluents = [
    ...new Set<number>([...DILUENT_OPTIONS_ML, blend.exampleDiluentMl ?? 2]),
  ].toSorted((a, b) => a - b)
  const shares = blendShares(blend.components, diluentMl, units)
  const amount = (mg: number) => fmtDose(mg, mg < 1 ? 'mcg' : 'mg', locale)
  return (
    <Card title={t('wiki.blendMath')} subtitle={t('wiki.blendMathHint')}>
      <div className="spec">{t('wiki.blendDiluent')}</div>
      <div className="mt-0.5 flex flex-wrap gap-x-2">
        {diluents.map((ml) => (
          <Chip key={ml} active={diluentMl === ml} onClick={() => setDiluentMl(ml)}>
            {fmtNumber(ml, locale, 1)} mL
          </Chip>
        ))}
      </div>
      <div className="spec mt-2">{t('wiki.blendUnits')}</div>
      <div className="mt-0.5 flex flex-wrap gap-x-2">
        {UNIT_OPTIONS.map((u) => (
          <Chip key={u} active={units === u} onClick={() => setUnits(u)}>
            {u} U
          </Chip>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {shares.map((s) => (
          <li key={s.compoundId} className="flex items-baseline justify-between gap-3 py-3">
            <span className="min-w-0 text-[14px] leading-snug">
              {compoundById(s.compoundId)?.names.generic ?? s.compoundId}
            </span>
            <span className="shrink-0 text-right">
              <span className="readout block text-[18px] font-semibold leading-tight">
                {amount(s.mg)}
              </span>
              <span className="readout block text-[12px] text-muted">{amount(s.mgPerMl)}/mL</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[12.5px] leading-snug text-muted">
        {t('wiki.blendPerDraw', { units, ml: fmtNumber(units / UNITS_PER_ML, locale, 2) })}
      </p>
    </Card>
  )
}

/** The blends this compound is sold in, as links. */
export function InBlends({ blends }: { blends: readonly CompoundMeta[] }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <Card title={t('wiki.inBlends')}>
      <ul className="-my-1 divide-y divide-line">
        {blends.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => nav(`/wiki/${b.id}`)} className={ROW}>
              <FlaskConical className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1 text-[14.5px] font-semibold leading-snug">
                {b.names.generic}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted/70" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
