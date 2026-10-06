/**
 * The compounds of the active protocols that no trial measured outcomes for: said once, plainly,
 * with the evidence the wiki holds and what the mechanism suggests, so the screen never implies a
 * number it does not have.
 */
import { Card } from '@/components/ui/Card'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundById, compoundName } from '@/content/compounds'
import type { CompoundOutlook } from '@/content/outlook'
import { t as l10n } from '@/content/schema'
import { compoundColor } from '@/content/substanceColor'
import type { Fmt } from './outlookFormat'

const NO_OUTLOOK_NOTE = l10n(
  'Esta sección aún no incluye referencias de resultados para esta sustancia.',
  'This section does not include outcome references for this substance yet.',
)

export interface NoDataEntry {
  compoundId: string
  outlook: CompoundOutlook | undefined
}

export function NoDataSection({ f, entries }: { f: Fmt; entries: readonly NoDataEntry[] }) {
  const { t, pick } = f
  if (entries.length === 0) return null
  return (
    <Card className="p-4">
      <p className="text-[13px] leading-snug text-ink-2">{t('outlook.noData.body')}</p>
      <ul className="mt-2 divide-y divide-line">
        {entries.map(({ compoundId, outlook }) => {
          const entry = compoundById(compoundId)
          return (
            <li key={compoundId} className="py-3 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="flex min-w-0 items-start gap-1.5">
                  <span className="mt-[6px] flex">
                    <SubstanceDot color={compoundColor(compoundId)} />
                  </span>
                  <span className="min-w-0 text-[14px] font-semibold leading-snug">
                    {compoundName(compoundId)}
                  </span>
                </span>
                {entry && (
                  <Badge tone="neutral">
                    {t('wiki.evidence')} · {t(`wiki.evidenceTiers.${entry.evidence}`)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                {outlook
                  ? pick(outlook.summary)
                  : `${entry ? pick(entry.pharmClass) : ''}. ${pick(NO_OUTLOOK_NOTE)}`}
              </p>
              {outlook?.kind === 'no_human_data' && (
                <p className="mt-1 text-[11px] leading-snug text-muted/80">{outlook.source}</p>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
