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
      {parts.map((b, i) => {
        const name = compoundById(b.compoundId)?.names.generic ?? b.compoundId
        return (
          <div key={b.compoundId} className="mb-2">
            <div className="flex items-start gap-2">
              <span className="mt-[15px] flex">
                <SubstanceDot color={compoundColor(b.compoundId)} />
              </span>
              <span className="min-w-0 flex-1 py-2.5 text-[14px] font-semibold leading-snug">
                {name}
              </span>
              <button
                type="button"
                aria-label={t('common.delete')}
                onClick={() => onChange(parts.filter((_, j) => j !== i))}
                className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </div>
            <Input
              inputMode="decimal"
              aria-label={t('inventory.totalOf', { name })}
              value={b.mg}
              onChange={(e) =>
                onChange(parts.map((x, j) => (j === i ? { ...x, mg: e.target.value } : x)))
              }
              suffix="mg"
              className="readout bg-panel"
            />
          </div>
        )
      })}
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
