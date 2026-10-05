import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SubstanceDot } from '@/components/ui/primitives'
import type { CompoundMeta } from '@/content/schema'
import { compoundColor } from '@/content/substanceColor'
import { fmtHours } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/** One substance in use to read up on: what it is, its half-life and evidence, and the entry. */
export function LearnCard({ compound }: { compound: CompoundMeta }) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const color = compoundColor(compound.id)
  return (
    <Link
      to={`/wiki/${compound.id}`}
      className="card block p-4 transition active:scale-[0.99]"
      style={{ borderColor: `color-mix(in oklab, ${color} 30%, var(--line))` }}
    >
      <div className="flex items-center gap-2">
        <SubstanceDot color={color} />
        <span className="min-w-0 break-words font-display text-[17px] font-semibold leading-snug">
          {compound.names.generic}
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{pick(compound.pharmClass)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {compound.pk && (
          <span className="spec">
            T½ <span className="text-ink">{fmtHours(compound.pk.halfLifeH, locale)}</span>
          </span>
        )}
        <span className="spec">
          {t('wiki.evidence')}{' '}
          <span className="text-ink">{t(`wiki.evidenceTiers.${compound.evidence}`)}</span>
        </span>
        <span className="spec ml-auto flex items-center gap-1 text-signal">
          <BookOpen aria-hidden className="size-3" /> {t('today.readMore')}
        </span>
      </div>
    </Link>
  )
}
