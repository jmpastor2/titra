import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { controlClass } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Chip, SubstanceDot } from '@/components/ui/primitives'
import { CATEGORY_ORDER, COMPOUNDS, compoundById, searchCompounds } from '@/content/compounds'
import { categoryColor, compoundColor } from '@/content/substanceColor'
import { useProtocols } from '@/data/hooks'
import { protocolCompoundIds } from '@/data/mappers'
import type { CompoundCategory } from '@/domain/types'
import { useLocale } from '@/lib/useLocale'

const NONE: readonly string[] = []

export function SubstancePicker({
  open,
  onClose,
  onPick,
  exclude = NONE,
}: {
  open: boolean
  onClose: () => void
  onPick: (compoundId: string) => void
  exclude?: readonly string[]
}) {
  return open ? <Picker onClose={onClose} onPick={onPick} exclude={exclude} /> : null
}

function Picker({
  onClose,
  onPick,
  exclude,
}: {
  onClose: () => void
  onPick: (compoundId: string) => void
  exclude: readonly string[]
}) {
  const { t } = useTranslation()
  const { pick } = useLocale()
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CompoundCategory | 'all'>('all')

  const mine = useMemo(() => {
    const ids = new Set((protocols.data ?? []).flatMap(protocolCompoundIds))
    return [...ids].filter((id) => !exclude.includes(id) && compoundById(id))
  }, [protocols.data, exclude])

  const results = useMemo(
    () =>
      searchCompounds(query, category === 'all' ? undefined : category).filter(
        (c) => !exclude.includes(c.id),
      ),
    [query, category, exclude],
  )

  const categories = useMemo(() => {
    const present = new Set(COMPOUNDS.map((c) => c.category))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [])

  return (
    <Sheet open onClose={onClose} title={t('picker.title')} tall>
      <div className="flex flex-col gap-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            data-autofocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('wiki.search')}
            aria-label={t('common.search')}
            className={`${controlClass} pl-11`}
          />
        </div>

        <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
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

        {mine.length > 0 && !query && category === 'all' && (
          <div>
            <div className="spec mb-2">{t('picker.mine')}</div>
            <div className="flex flex-wrap gap-2">
              {mine.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPick(id)}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel-2 px-3 py-2 text-[13.5px] font-semibold"
                >
                  <SubstanceDot color={compoundColor(id)} />
                  {compoundById(id)?.names.generic}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="divide-y divide-line">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="flex w-full items-center gap-3 py-3 text-left active:opacity-70"
              >
                <SubstanceDot color={categoryColor(c.category)} size={10} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">
                    {c.names.generic}
                  </span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {c.names.brands.length ? `${c.names.brands.slice(0, 3).join(' · ')} · ` : ''}
                    {pick(c.pharmClass)}
                  </span>
                </span>
                <span className="spec shrink-0">{t(`units.${c.defaultUnit}`)}</span>
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <p className="py-8 text-center text-[13px] text-muted">{t('wiki.noResults')}</p>
        )}
      </div>
    </Sheet>
  )
}
