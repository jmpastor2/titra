import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Row } from '@/components/ui/primitives'
import { controlClass } from '@/components/ui/Field'
import { CATEGORY_ORDER, COMPOUNDS, searchCompounds } from '@/content/compounds'
import type { CompoundCategory } from '@/domain/types'
import { useLocale } from '@/lib/useLocale'
import { evidenceTone } from './tones'

export function WikiPage() {
  const { t } = useTranslation()
  const { pick } = useLocale()
  const nav = useNavigate()
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

  const grouped = useMemo(() => {
    if (category !== 'all' || query) return null
    return categories.map((cat) => ({
      cat,
      items: results.filter((c) => c.category === cat),
    }))
  }, [categories, results, category, query])

  return (
    <div>
      <PageHeader
        title={t('wiki.title')}
        large
        subtitle={t('wiki.count', { count: results.length })}
      />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('wiki.search')}
          aria-label={t('common.search')}
          className={`${controlClass} pl-10 pr-10`}
        />
        {query && (
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-surface-2 text-muted"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="hide-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <CategoryChip active={category === 'all'} onClick={() => setCategory('all')}>
          {t('wiki.all')}
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {t(`wiki.categories.${c}`)}
          </CategoryChip>
        ))}
      </div>

      {results.length === 0 ? (
        <Card>
          <EmptyState icon={<Search className="size-7" />} title={t('wiki.noResults')} />
        </Card>
      ) : grouped ? (
        <div className="flex flex-col gap-4">
          {grouped
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.cat}>
                <h2 className="mb-1.5 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted">
                  {t(`wiki.categories.${g.cat}`)} · {g.items.length}
                </h2>
                <Card padded={false} className="px-4">
                  <ul className="divide-y divide-line">
                    {g.items.map((c) => (
                      <li key={c.id}>
                        <Row
                          onClick={() => nav(`/wiki/${c.id}`)}
                          title={c.names.generic}
                          subtitle={pick(c.pharmClass)}
                          trailing={
                            <Badge tone={evidenceTone(c.evidence)}>
                              {t(`wiki.evidenceTiers.${c.evidence}`)}
                            </Badge>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
        </div>
      ) : (
        <Card padded={false} className="px-4">
          <ul className="divide-y divide-line">
            {results.map((c) => (
              <li key={c.id}>
                <Row
                  onClick={() => nav(`/wiki/${c.id}`)}
                  title={c.names.generic}
                  subtitle={
                    c.names.brands.length > 0
                      ? `${c.names.brands.join(' · ')} — ${pick(c.pharmClass)}`
                      : pick(c.pharmClass)
                  }
                  trailing={
                    <Badge tone={evidenceTone(c.evidence)}>
                      {t(`wiki.evidenceTiers.${c.evidence}`)}
                    </Badge>
                  }
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'shrink-0 rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-bg'
          : 'shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2'
      }
    >
      {children}
    </button>
  )
}
