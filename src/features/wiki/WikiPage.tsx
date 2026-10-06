import { ChevronDown, FlaskConical, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { whenIdle } from '@/app/idle'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { controlClass } from '@/components/ui/Field'
import { EmptyState, SectionTitle, SubstanceDot } from '@/components/ui/primitives'
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
import { useLocale } from '@/lib/useLocale'
import { EvidenceTag } from './EvidenceMeter'

interface Family {
  key: string
  title: string
  icon: ReactNode
  items: readonly CompoundMeta[]
}

/**
 * The catalogue: one search field, then what you use and every family folded into one list.
 * Typing turns the page into a flat list of matches.
 */
export function WikiPage() {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchWiki(query), [query])

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

  const families = useMemo<Family[]>(() => {
    // A blend that is already under "yours" does not need a second row among the blends.
    const yours = new Set(mine.map((c) => c.id))
    const blends = BLENDS.filter((b) => !yours.has(b.id))
    const byCategory = CATEGORY_ORDER.flatMap((cat) => {
      const items = COMPOUNDS.filter((c) => c.category === cat)
      return items.length === 0
        ? []
        : [
            {
              key: cat,
              title: t(`wiki.categories.${cat}`),
              icon: <SubstanceDot color={categoryColor(cat)} size={9} />,
              items,
            },
          ]
    })
    return blends.length === 0
      ? byCategory
      : [
          {
            key: 'blends',
            title: t('wiki.blends'),
            icon: <FlaskConical className="size-[15px] text-muted" aria-hidden />,
            items: blends,
          },
          ...byCategory,
        ]
  }, [mine, t])

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

      <div className="relative mb-5">
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

      {results.length === 0 ? (
        <Card>
          <EmptyState title={t('wiki.noResults')} description={t('wiki.noResultsHint')} />
        </Card>
      ) : query ? (
        <Card padded={false} className="px-4">
          <CompoundList items={results} showBrands />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {mine.length > 0 && (
            <section>
              <SectionTitle>{t('wiki.mine')}</SectionTitle>
              <Card padded={false} className="px-4">
                <CompoundList items={mine} />
              </Card>
            </section>
          )}
          <section>
            <SectionTitle>{t('wiki.families')}</SectionTitle>
            <Card padded={false} className="px-4">
              <ul className="divide-y divide-line">
                {families.map((f) => (
                  <li key={f.key}>
                    <FamilyFold family={f} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>
      )}
    </div>
  )
}

/** One family: its name and size, and its entries once opened. */
function FamilyFold({ family }: { family: Family }) {
  return (
    <details className="group">
      <summary className="-mx-2 flex min-h-[52px] cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-2.5 outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60 [&::-webkit-details-marker]:hidden">
        <span className="grid w-[15px] shrink-0 place-items-center">{family.icon}</span>
        <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">
          {family.title}
        </span>
        <span className="readout text-[13px] text-muted">{family.items.length}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="border-t border-line pl-[27px]">
        <CompoundList items={family.items} dots={false} />
      </div>
    </details>
  )
}

function CompoundList({
  items,
  showBrands = false,
  dots = true,
}: {
  items: readonly CompoundMeta[]
  showBrands?: boolean
  /** Inside a family the family's dot is already there. */
  dots?: boolean
}) {
  const { pick } = useLocale()
  const nav = useNavigate()
  return (
    <ul className="divide-y divide-line">
      {items.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => nav(`/wiki/${c.id}`)}
            className="-mx-2 flex min-h-[60px] w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            {dots && <SubstanceDot color={categoryColor(c.category)} size={9} />}
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-snug">
                {c.names.generic}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted">
                {c.blend
                  ? c.blend.components.map((p) => compoundName(p.compoundId)).join(' + ')
                  : showBrands && c.names.brands.length > 0
                    ? `${c.names.brands.slice(0, 3).join(' · ')} · ${pick(c.pharmClass)}`
                    : pick(c.pharmClass)}
              </span>
            </span>
            <EvidenceTag tier={c.evidence} />
          </button>
        </li>
      ))}
    </ul>
  )
}
