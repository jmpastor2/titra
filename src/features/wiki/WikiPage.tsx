import { ChevronDown, FlaskConical, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { whenIdle } from '@/app/idle'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { controlClass } from '@/components/ui/Field'
import { Badge, Chip, EmptyState, SectionTitle, SubstanceDot } from '@/components/ui/primitives'
import {
  BLENDS,
  CATEGORY_ORDER,
  COMPOUNDS,
  compoundById,
  compoundName,
  preloadCompoundDetails,
  searchWiki,
} from '@/content/compounds'
import type { CompoundMeta } from '@/content/schema'
import { categoryColor } from '@/content/substanceColor'
import { useProtocols } from '@/data/hooks'
import { protocolCompoundIds } from '@/data/mappers'
import type { CompoundCategory } from '@/domain/types'
import { fmtHours } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { evidenceTone } from './tones'

export function WikiPage() {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CompoundCategory | 'blends' | 'all'>('all')

  const results = useMemo(
    () => searchWiki(query, category === 'all' ? undefined : category),
    [query, category],
  )

  const categories = useMemo(() => {
    const present = new Set(COMPOUNDS.map((c) => c.category))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [])

  const mine = useMemo(() => {
    const ids = new Set((protocols.data ?? []).flatMap(protocolCompoundIds))
    const substances = [...ids].flatMap((id) => {
      const c = compoundById(id)
      return c ? [c] : []
    })
    // A blend is "yours" when every one of its components is in your protocols.
    const blends = BLENDS.filter((b) => b.blend?.components.every((p) => ids.has(p.compoundId)))
    return [...substances, ...blends]
  }, [protocols.data])

  const browsing = category === 'all' && !query
  // A blend that is already under "yours" does not need a second row in the blends list.
  const otherBlends = useMemo(() => {
    const yours = new Set(mine.map((c) => c.id))
    return results.filter((c) => c.blend && !yours.has(c.id))
  }, [mine, results])

  // Most visits open an entry next: fetch its (cached, precached) chunk once the list has painted.
  useEffect(() => whenIdle(() => void preloadCompoundDetails().catch(() => {})), [])

  return (
    <div>
      <PageHeader
        eyebrow={t('wiki.eyebrow')}
        title={t('wiki.title')}
        large
        subtitle={t('wiki.count', { count: results.length })}
      />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('wiki.search')}
          aria-label={t('common.search')}
          className={`${controlClass} pl-11 pr-11`}
        />
        {query && (
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setQuery('')}
            className="absolute right-0.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            <span className="grid size-7 place-items-center rounded-full bg-panel-3">
              <X className="size-3.5" aria-hidden />
            </span>
          </button>
        )}
      </div>

      <div className="hide-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          {t('wiki.all')}
        </Chip>
        <Chip active={category === 'blends'} onClick={() => setCategory('blends')}>
          <FlaskConical className="size-3.5" aria-hidden />
          {t('wiki.blends')}
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c}
            active={category === c}
            color={categoryColor(c)}
            onClick={() => setCategory(c)}
          >
            {t(`wiki.categories.${c}`)}
          </Chip>
        ))}
      </div>

      {results.length === 0 ? (
        <Card>
          <EmptyState icon={<Search className="size-7" />} title={t('wiki.noResults')} />
        </Card>
      ) : browsing ? (
        <div className="flex flex-col gap-5">
          {mine.length > 0 && (
            <section>
              <SectionTitle>{t('wiki.mine')}</SectionTitle>
              <CompoundList items={mine} />
            </section>
          )}
          {otherBlends.length > 0 && (
            <section>
              <SectionTitle action={<span className="spec">{otherBlends.length}</span>}>
                <span className="inline-flex items-center gap-2">
                  <FlaskConical className="size-3.5 text-muted" aria-hidden />
                  {t('wiki.blends')}
                </span>
              </SectionTitle>
              <CompoundList items={otherBlends} />
            </section>
          )}
          {categories.map((cat) => {
            // Blends have their own section while browsing.
            const items = results.filter((c) => c.category === cat && !c.blend)
            if (items.length === 0) return null
            return (
              <details key={cat} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control border border-line bg-panel px-4 py-2.5 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
                    <SubstanceDot color={categoryColor(cat)} />
                    {t(`wiki.categories.${cat}`)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="spec">{items.length}</span>
                    <ChevronDown
                      className="size-4 text-muted transition group-open:rotate-180"
                      aria-hidden
                    />
                  </span>
                </summary>
                <div className="mt-2">
                  <CompoundList items={items} />
                </div>
              </details>
            )
          })}
        </div>
      ) : (
        <CompoundList items={results} showBrands />
      )}
    </div>
  )
}

function CompoundList({
  items,
  showBrands = false,
}: {
  items: readonly CompoundMeta[]
  showBrands?: boolean
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  return (
    <Card padded={false} className="px-4">
      <ul className="divide-y divide-line">
        {items.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => nav(`/wiki/${c.id}`)}
              className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
            >
              <SubstanceDot color={categoryColor(c.category)} size={9} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug">
                  {c.names.generic}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted">
                  {c.blend ? (
                    c.blend.components.map((p) => compoundName(p.compoundId)).join(' + ')
                  ) : (
                    <>
                      {showBrands && c.names.brands.length > 0
                        ? `${c.names.brands.slice(0, 3).join(' · ')} — `
                        : ''}
                      {pick(c.pharmClass)}
                    </>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={evidenceTone(c.evidence)}>
                  {t(`wiki.evidenceTiers.${c.evidence}`)}
                </Badge>
                {c.pk && (
                  <span className="readout text-[11px] text-muted">
                    T½ {fmtHours(c.pk.halfLifeH, locale)}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
