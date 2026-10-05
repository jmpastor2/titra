import { Trash2 } from 'lucide-react'

/**
 * The trash button at the end of a list row: 44 px to hit, drawn small. The negative
 * margins take the extra size back out of the row's height and padding.
 */
export function RowDelete({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="-my-2 -mr-2.5 grid size-11 shrink-0 place-items-center rounded-full text-muted outline-none transition hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-signal/60"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  )
}
