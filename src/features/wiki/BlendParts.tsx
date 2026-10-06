import { ChevronRight, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge, Chip, Divider, SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import type { BlendInfo, CompoundMeta } from '@/content/schema'
import { categoryColor } from '@/content/substanceColor'
import { fmtDose, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { blendShares, UNITS_PER_ML } from './blendMath'
import { Section } from './parts'
import { evidenceTone } from './tones'

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
      <ul className="flex flex-col gap-2">
        {blend.components.map((p) => {
          const c = compoundById(p.compoundId)
          if (!c) return null
          return (
            <li key={p.compoundId}>
              <button
                type="button"
                onClick={() => nav(`/wiki/${c.id}`)}
                className="flex min-h-14 w-full items-center gap-3 rounded-control border border-line px-3 py-2.5 text-left transition active:scale-[0.99]"
              >
                <SubstanceDot color={categoryColor(c.category)} size={9} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-snug">
                    {c.names.generic}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                    {pick(c.pharmClass)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="readout text-[14px] font-semibold">
                    {fmtDose(p.mg, 'mg', locale)}
                  </span>
                  <Badge tone={evidenceTone(c.evidence)}>
                    {t(`wiki.evidenceTiers.${c.evidence}`)}
                  </Badge>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      <Divider className="my-3.5" />
      <Section title={t('wiki.blendWhy')}>{pick(blend.rationale)}</Section>
      <p className="mt-3 text-[12px] leading-snug text-muted">{t('wiki.blendEvidenceNote')}</p>
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
      <div className="mt-1 flex flex-wrap gap-x-2">
        {diluents.map((ml) => (
          <Chip key={ml} active={diluentMl === ml} onClick={() => setDiluentMl(ml)}>
            {fmtNumber(ml, locale, 1)} mL
          </Chip>
        ))}
      </div>
      <div className="spec mt-2">{t('wiki.blendUnits')}</div>
      <div className="mt-1 flex flex-wrap gap-x-2">
        {UNIT_OPTIONS.map((u) => (
          <Chip key={u} active={units === u} onClick={() => setUnits(u)}>
            {u} U
          </Chip>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-line rounded-control bg-panel-2 px-3.5">
        {shares.map((s) => (
          <li key={s.compoundId} className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="min-w-0 text-[13.5px] leading-snug">
              {compoundById(s.compoundId)?.names.generic ?? s.compoundId}
            </span>
            <span className="shrink-0 text-right">
              <span className="readout block text-[16px] font-semibold">{amount(s.mg)}</span>
              <span className="readout block text-[11px] text-muted">{amount(s.mgPerMl)}/mL</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[12px] leading-snug text-muted">
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
      <div className="flex flex-wrap gap-2">
        {blends.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => nav(`/wiki/${b.id}`)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-left text-[13px] font-semibold leading-snug text-ink-2 transition active:scale-[0.98]"
          >
            <FlaskConical className="size-3.5 shrink-0 text-muted" aria-hidden />
            {b.names.generic}
            <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden />
          </button>
        ))}
      </div>
    </Card>
  )
}
