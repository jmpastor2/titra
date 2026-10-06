import { useId } from 'react'
import { Input } from '@/components/ui/Field'

/**
 * A day that is usually right as it comes (today, the day it was opened): the label at the
 * left and the date at the right on one line, so it takes the room of a row, not of a field.
 */
export function DateRow({
  label,
  value,
  max,
  onChange,
}: {
  label: string
  /** yyyy-MM-dd */
  value: string
  max?: string
  onChange: (date: string) => void
}) {
  const id = useId()
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <label htmlFor={id} className="min-w-0 text-[13px] font-medium leading-snug text-ink-2">
        {label}
      </label>
      <div className="w-[11rem] shrink-0">
        <Input
          id={id}
          type="date"
          value={value}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="readout"
        />
      </div>
    </div>
  )
}
