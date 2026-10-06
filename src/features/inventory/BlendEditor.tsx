import { ChevronDown, Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Field'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'

/** One more substance of a premixed vial: what it is and its mg in the vial, as typed. */
export interface BlendRow {
  compoundId: string
  mg: string
}

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id

/**
 * One substance of a vial and its mg, on a single line: the name (it wraps, never cut) and
 * the amount at the right, so the substances of a blend read as a short list. `onPick` makes
 * the name the control that changes the substance; `onRemove` adds the cross that drops it;
 * `gutter` keeps the room of that cross so the amounts line up under each other.
 */
export function ContentRow({
  compoundId,
  placeholder,
  onPick,
  mg,
  onMg,
  mgLabel,
  onRemove,
  gutter = false,
}: {
  compoundId: string
  /** Shown instead of a name while there is no substance yet. */
  placeholder?: ReactNode
  onPick?: () => void
  mg: string
  onMg: (mg: string) => void
  mgLabel: string
  onRemove?: () => void
  gutter?: boolean
}) {
  const { t } = useTranslation()
  // The dot sits on the first line of a name that wraps.
  const name = compoundId ? (
    <span className="flex min-w-0 items-start gap-2.5">
      <span className="mt-[7px] flex">
        <SubstanceDot color={compoundColor(compoundId)} />
      </span>
      <span className="min-w-0 break-words text-[15px] font-semibold leading-snug">
        {nameOf(compoundId)}
      </span>
    </span>
  ) : (
    <span className="text-[15px] font-semibold text-signal">{placeholder}</span>
  )

  return (
    <div className="flex min-h-[60px] items-center gap-2 py-1.5">
      {onPick ? (
        <button
          type="button"
          onClick={onPick}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          {name}
          <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2.5">{name}</span>
      )}
      {/* The unit outside the box, so a narrow field still shows "0,125" whole. */}
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="w-[5.5rem]">
          <Input
            inputMode="decimal"
            aria-label={mgLabel}
            value={mg}
            onChange={(e) => onMg(e.target.value)}
            className="readout text-right font-semibold"
          />
        </span>
        <span className="text-[13px] font-medium text-muted">mg</span>
      </span>
      {onRemove ? (
        <button
          type="button"
          aria-label={t('inventory.blendRemove', { name: nameOf(compoundId) })}
          onClick={onRemove}
          className="-mr-2.5 grid size-11 shrink-0 place-items-center rounded-full text-muted outline-none hover:text-danger focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          <X className="size-4" />
        </button>
      ) : (
        gutter && <span aria-hidden className="-mr-2.5 w-11 shrink-0" />
      )}
    </div>
  )
}

/**
 * The other substances a vial holds, as rows under the first one, then the link to add one.
 * With parts it says, once, that they are drawn together in one load.
 */
export function BlendEditor({
  parts,
  onChange,
  onAdd,
}: {
  parts: readonly BlendRow[]
  onChange: (next: BlendRow[]) => void
  onAdd: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      {parts.map((b, i) => (
        <ContentRow
          key={b.compoundId}
          compoundId={b.compoundId}
          mg={b.mg}
          onMg={(mg) => onChange(parts.map((x, j) => (j === i ? { ...x, mg } : x)))}
          mgLabel={t('inventory.totalOf', { name: nameOf(b.compoundId) })}
          onRemove={() => onChange(parts.filter((_, j) => j !== i))}
        />
      ))}
      <div className="pt-1">
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-11 items-center gap-1.5 text-[13.5px] font-semibold text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          <Plus className="size-4" aria-hidden /> {t('inventory.blendAdd')}
        </button>
        {parts.length > 0 && (
          <p className="text-[12.5px] leading-snug text-muted">{t('inventory.blendTogether')}</p>
        )}
      </div>
    </>
  )
}
