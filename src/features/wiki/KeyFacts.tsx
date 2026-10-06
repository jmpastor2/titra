import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { CompoundDetail, ProtocolTemplate } from '@/content/schema'
import { fmtDose, fmtHours } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { EVIDENCE_RUNGS, evidenceLevel, fmtDoseRange, templateDoseRange } from './facts'
import { evidenceTone, toneFill, toneText } from './tones'

interface Fact {
  key: string
  label: ReactNode
  hint?: ReactNode
  body: ReactNode
}

function Cell({ fact, wide }: { fact: Fact; wide: boolean }) {
  return (
    <div className={clsx('min-w-0 bg-panel p-3.5', wide && 'col-span-2')}>
      <div className="spec">{fact.label}</div>
      <div className="mt-1.5">{fact.body}</div>
      {fact.hint && <div className="mt-1.5 text-[12px] leading-snug text-muted">{fact.hint}</div>}
    </div>
  )
}

/** Seven rungs, filled up to the tier: how much human evidence there is, at a glance. */
function EvidenceMeter({ level, fill }: { level: number; fill: string }) {
  return (
    <div className="mt-2 flex gap-1" aria-hidden>
      {Array.from({ length: EVIDENCE_RUNGS }, (_, i) => (
        <span
          key={i}
          className={clsx('h-1.5 flex-1 rounded-full', i < level ? fill : 'bg-panel-3')}
        />
      ))}
    </div>
  )
}

/**
 * The four facts people come to an entry for: how solid the evidence is, how long it stays in
 * the body, what the label or the trials dose it at, and how it goes in. Everything else on
 * the page is folded below.
 */
export function KeyFacts({
  compound,
  templates,
}: {
  compound: CompoundDetail
  templates: readonly ProtocolTemplate[]
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const tone = evidenceTone(compound.evidence)
  const range = templateDoseRange(templates)
  const frequency = compound.dosing.frequency
  const total = compound.blend?.components.reduce((sum, p) => sum + p.mg, 0)
  const parts = compound.blend?.components.length ?? 0

  const facts: Fact[] = [
    {
      key: 'evidence',
      label: t('wiki.evidence'),
      body: (
        <>
          <div className={clsx('text-[19px] font-semibold leading-tight', toneText[tone])}>
            {t(`wiki.evidenceTiers.${compound.evidence}`)}
          </div>
          <EvidenceMeter level={evidenceLevel(compound.evidence)} fill={toneFill[tone]} />
        </>
      ),
    },
  ]

  if (compound.pk) {
    facts.push({
      key: 'halfLife',
      label: t('wiki.halfLife'),
      hint:
        compound.pk.tmaxH !== undefined
          ? t('wiki.peak', { time: fmtHours(compound.pk.tmaxH, locale) })
          : undefined,
      body: (
        <div className="readout text-[22px] font-semibold leading-tight">
          {fmtHours(compound.pk.halfLifeH, locale)}
        </div>
      ),
    })
  } else if (total !== undefined) {
    facts.push({
      key: 'perVial',
      label: t('wiki.perVial'),
      hint: t('wiki.parts', { count: parts }),
      body: (
        <div className="readout text-[22px] font-semibold leading-tight">
          {fmtDose(total, 'mg', locale)}
        </div>
      ),
    })
  }

  if (range) {
    facts.push({
      key: 'dose',
      label: t('wiki.doseRange'),
      hint: frequency ? pick(frequency) : t('wiki.doseRangeHint'),
      body: (
        <div className="readout text-[20px] font-semibold leading-tight">
          {fmtDoseRange(range, compound.defaultUnit, locale)}
        </div>
      ),
    })
  } else if (frequency) {
    facts.push({
      key: 'frequency',
      label: t('wiki.usualFrequency'),
      body: <div className="text-[14.5px] font-semibold leading-snug">{pick(frequency)}</div>,
    })
  }

  facts.push({
    key: 'routes',
    label: t('wiki.routes'),
    body: (
      <div className="text-[14.5px] font-semibold leading-snug">
        {compound.routes.map((r) => t(`wiki.routeNames.${r}`)).join(' · ')}
      </div>
    ),
  })

  return (
    <Card padded={false} instrument>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[inherit] bg-line">
        {facts.map((fact, i) => (
          <Cell
            key={fact.key}
            fact={fact}
            wide={facts.length % 2 === 1 && i === facts.length - 1}
          />
        ))}
      </div>
    </Card>
  )
}
