import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { controlClass } from '@/components/ui/Field'
import { Badge, Chip, EmptyState, SectionTitle, SubstanceDot } from '@/components/ui/primitives'
import { CATEGORY_ORDER, COMPOUNDS, compoundById, searchCompounds } from '@/content/compounds'
import type { CompoundEntry } from '@/content/schema'
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
  const [category, setCategory] = useState<CompoundCategory | 'all'>('all')

  const results = useMemo(
    () => searchCompounds(query, category === 'all' ? undefined : category),
    [query, category],
  )

  const categories = useMemo(() => {
    const present = new Set(COMPOUNDS.map((c) => c.category))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [])

  const mine = useMemo(() => {
    const ids = new Set((protocols.data ?? []).flatMap(protocolCompoundIds))
    return [...ids].flatMap((id) => {
      const c = compoundById(id)
      return c ? [c] : []
    })
  }, [protocols.data])

  const browsing = category === 'all' && !query

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
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-panel-3 text-muted"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="hide-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          {t('wiki.all')}
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
              <SectionTitle index="◆">{t('wiki.mine')}</SectionTitle>
              <CompoundList items={mine} />
            </section>
          )}
          {categories.map((cat) => {
            const items = results.filter((c) => c.category === cat)
            if (items.length === 0) return null
            return (
              <section key={cat}>
                <SectionTitle action={<span className="spec">{items.length}</span>}>
                  <span className="inline-flex items-center gap-2">
                    <SubstanceDot color={categoryColor(cat)} />
                    {t(`wiki.categories.${cat}`)}
                  </span>
                </SectionTitle>
                <CompoundList items={items} />
              </section>
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
  items: readonly CompoundEntry[]
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
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition active:bg-panel-2"
            >
              <SubstanceDot color={categoryColor(c.category)} size={9} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{c.names.generic}</span>
                <span className="block truncate text-[12.5px] text-muted">
                  {showBrands && c.names.brands.length > 0
                    ? `${c.names.brands.slice(0, 3).join(' · ')} — `
                    : ''}
                  {pick(c.pharmClass)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={evidenceTone(c.evidence)}>
                  {t(`wiki.evidenceTiers.${c.evidence}`)}
                </Badge>
                {c.pk && (
                  <span className="readout text-[10.5px] text-muted">
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
