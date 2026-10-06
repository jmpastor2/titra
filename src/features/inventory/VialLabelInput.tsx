import { clsx } from 'clsx'
import { controlClass } from '@/components/ui/Field'

/**
 * The name of a vial. It is a name, so one line of text, but a name like "CJC-1295 (sin DAC)
 * + Ipamorelina 10 mg" is longer than a phone-width field: it wraps over two lines instead
 * of being cut off at the side, and Enter finishes it rather than adding a line break.
 */
export function VialLabelInput({
  id,
  describedBy,
  value,
  onChange,
  placeholder,
}: {
  id: string
  describedBy: string | undefined
  value: string
  onChange: (next: string) => void
  placeholder: string
}) {
  return (
    <textarea
      id={id}
      rows={2}
      enterKeyHint="done"
      aria-describedby={describedBy}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\s*\n\s*/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault()
      }}
      className={clsx(controlClass, 'h-auto resize-none py-3 leading-snug')}
    />
  )
}
