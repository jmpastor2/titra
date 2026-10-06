import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { CompoundDetail, ProtocolTemplate } from '@/content/schema'
import { fmtDose, fmtHours } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { EvidenceBars } from './EvidenceMeter'
import { fmtDoseRange, templateDoseRange } from './facts'
import { evidenceColor } from './tones'

interface Fact {
  key: string
  label: ReactNode
  hint?: ReactNode
  body: ReactNode
}

const NUMBER = 'readout text-[24px] font-semibold leading-none'
const WORDS = 'text-[16px] font-semibold leading-snug'

/**
 * The four facts people come to an entry for, as one definition grid: how solid the evidence is,
 * how long it stays in the body, what the label or the trials dose it at, and how it goes in.
 * Everything else on the page is folded below.
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
  const range = templateDoseRange(templates)
  const frequency = compound.dosing.frequency
  const total = compound.blend?.components.reduce((sum, p) => sum + p.mg, 0)
  const parts = compound.blend?.components.length ?? 0

  const facts: Fact[] = [
    {
      key: 'evidence',
      label: t('wiki.evidence'),
      hint: t(`wiki.evidenceHints.${compound.evidence}`),
      body: (
        <span className="flex items-end gap-2.5">
          <span
            className="text-[18px] font-semibold leading-none"
            style={{ color: evidenceColor(compound.evidence) }}
          >
            {t(`wiki.evidenceTiers.${compound.evidence}`)}
          </span>
          <EvidenceBars tier={compound.evidence} height={17} />
        </span>
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
      body: <span className={NUMBER}>{fmtHours(compound.pk.halfLifeH, locale)}</span>,
    })
  } else if (total !== undefined) {
    facts.push({
      key: 'perVial',
      label: t('wiki.perVial'),
      hint: t('wiki.parts', { count: parts }),
      body: <span className={NUMBER}>{fmtDose(total, 'mg', locale)}</span>,
    })
  }

  if (range) {
    facts.push({
      key: 'dose',
      label: t('wiki.doseRange'),
      hint: frequency ? pick(frequency) : t('wiki.doseRangeHint'),
      body: <span className={NUMBER}>{fmtDoseRange(range, compound.defaultUnit, locale)}</span>,
    })
  } else if (frequency) {
    facts.push({
      key: 'frequency',
      label: t('wiki.usualFrequency'),
      body: <span className={WORDS}>{pick(frequency)}</span>,
    })
  }

  facts.push({
    key: 'routes',
    label: t('wiki.routes'),
    body: (
      <span className={WORDS}>
        {compound.routes.map((r) => t(`wiki.routeNames.${r}`)).join(' · ')}
      </span>
    ),
  })

  return (
    <Card>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-5">
        {facts.map((fact, i) => (
          <div
            key={fact.key}
            className={clsx(
              'flex min-w-0 flex-col',
              facts.length % 2 === 1 && i === facts.length - 1 && 'col-span-2',
            )}
          >
            <dt className="spec">{fact.label}</dt>
            <dd className="mt-2 flex min-h-6 items-end">{fact.body}</dd>
            {fact.hint && (
              <dd className="mt-1.5 text-[12.5px] leading-snug text-muted">{fact.hint}</dd>
            )}
          </div>
        ))}
      </dl>
    </Card>
  )
}
