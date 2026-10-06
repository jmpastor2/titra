import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

/** A caution that comes with a change: amber words with a sign, and no box around them. */
export function Caution({
  children,
  role,
  className,
}: {
  children: ReactNode
  /** `status` when it appears because of something just typed. */
  role?: 'status' | 'alert'
  className?: string
}) {
  return (
    <p
      role={role}
      className={`flex items-start gap-2 text-[13px] leading-snug text-warn ${className ?? ''}`}
    >
      <AlertTriangle aria-hidden className="mt-px size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  )
}
