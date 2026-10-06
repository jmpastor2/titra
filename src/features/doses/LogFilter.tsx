import { clsx } from 'clsx'
import { ChevronDown, ListFilter } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { shortNames } from './substanceNames'

/** One thing you inject: a blend or a stack is one entry, not one per compound. */
export interface LogCombo {
  key: string
  compoundIds: readonly string[]
}

/** Room for the dots (or the icon) in front of the label: none, one, two, three or more. */
const LEFT_PADDING = ['pl-10', 'pl-9', 'pl-11', 'pl-14']

/**
 * Which doses the log shows, in one 44 px line: the whole history, or one thing you inject.
 * A native menu, so the names are never squeezed into chips and iOS offers its own picker.
 */
export function LogFilter({
  value,
  combos,
  onChange,
}: {
  value: string
  combos: readonly LogCombo[]
  onChange: (key: string) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const current = combos.find((c) => c.key === value)
  return (
    <div className="relative mb-4">
      <label htmlFor={id} className="sr-only">
        {t('doses.filter.label')}
      </label>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center gap-1"
      >
        {current ? (
          current.compoundIds.map((c) => <SubstanceDot key={c} color={compoundColor(c)} />)
        ) : (
          <ListFilter className="size-4 text-muted" />
        )}
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'h-11 w-full appearance-none rounded-full border border-line bg-panel pr-10 text-[14px] font-semibold text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60',
          LEFT_PADDING[Math.min(current?.compoundIds.length ?? 0, 3)],
        )}
      >
        <option value="all">{t('doses.filter.all')}</option>
        {combos.map((c) => (
          <option key={c.key} value={c.key}>
            {shortNames(c.compoundIds)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3.5 my-auto size-4 text-muted"
      />
    </div>
  )
}
