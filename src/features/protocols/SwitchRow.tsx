import type { ReactNode } from 'react'
import { Switch } from '@/components/ui/primitives'

/**
 * A choice inside a card: what it does and what follows on the left, the switch on the right.
 * No panel of its own, so it sits in the card like any other row.
 */
export function SwitchRow({
  checked,
  onChange,
  label,
  hint,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold leading-snug">{label}</p>
        {hint && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}
