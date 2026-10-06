import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { EvidenceTier } from '@/domain/types'
import { EVIDENCE_RUNGS, evidenceLevel } from './facts'
import { evidenceColor } from './tones'

/**
 * How much human evidence there is, drawn like signal bars: one rising bar per rung of the
 * ladder (anecdotal … approved), lit up to the tier. Decoration only: the tier is always written
 * next to it.
 */
export function EvidenceBars({
  tier,
  height = 14,
  className,
}: {
  tier: EvidenceTier
  height?: number
  className?: string
}) {
  const level = evidenceLevel(tier)
  const color = evidenceColor(tier)
  return (
    <span
      aria-hidden
      data-level={level}
      className={clsx('inline-flex shrink-0 items-end gap-[2px]', className)}
      style={{ height }}
    >
      {Array.from({ length: EVIDENCE_RUNGS }, (_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-[1.5px]"
          style={{
            height: `${((i + 2) / (EVIDENCE_RUNGS + 1)) * 100}%`,
            background: i < level ? color : 'var(--panel-3)',
          }}
        />
      ))}
    </span>
  )
}

/**
 * The tier in words with its bars, as lists show it: stacked at the end of a row, or inline in a
 * line of text.
 */
export function EvidenceTag({
  tier,
  layout = 'stack',
  className,
}: {
  tier: EvidenceTier
  layout?: 'stack' | 'inline'
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span
      className={clsx(
        'inline-flex text-[12px] font-medium leading-none text-muted',
        layout === 'stack' ? 'flex-col items-end gap-1.5' : 'items-end gap-1.5',
        className,
      )}
    >
      <EvidenceBars tier={tier} height={layout === 'stack' ? 14 : 11} />
      <span className="whitespace-nowrap">{t(`wiki.evidenceTiers.${tier}`)}</span>
    </span>
  )
}
