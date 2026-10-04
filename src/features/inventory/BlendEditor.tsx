import { Plus, X } from 'lucide-react'
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

/**
 * The other substances a vial holds. Empty, it is just the link to add one; with parts it
 * explains that they are drawn together, in one load.
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
    <div
      className={parts.length > 0 ? 'rounded-control border border-line bg-panel-2 p-3' : undefined}
    >
      {parts.length > 0 && (
        <>
          <div className="spec mb-1">{t('inventory.blendTitle')}</div>
          <p className="mb-2 text-[12px] text-muted">{t('inventory.blendHint')}</p>
        </>
      )}
      {parts.map((b, i) => (
        <div key={b.compoundId} className="mb-1 flex items-center gap-2">
          <SubstanceDot color={compoundColor(b.compoundId)} />
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
            {compoundById(b.compoundId)?.names.generic ?? b.compoundId}
          </span>
          <div className="w-[110px]">
            <Input
              inputMode="decimal"
              aria-label={t('inventory.totalMg')}
              value={b.mg}
              onChange={(e) =>
                onChange(parts.map((x, j) => (j === i ? { ...x, mg: e.target.value } : x)))
              }
              suffix="mg"
              className="readout h-10 bg-panel"
            />
          </div>
          <button
            type="button"
            aria-label={t('common.delete')}
            onClick={() => onChange(parts.filter((_, j) => j !== i))}
            className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-danger"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-signal"
      >
        <Plus className="size-4" /> {t('inventory.blendAdd')}
      </button>
    </div>
  )
}
