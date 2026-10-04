import { useCycleText } from './cycleText'
import type { CycleSummary } from './cycleView'

/** "El lun 5 oct sube a 15 U · mañana": what changes next and how soon. */
export function NextChange({ summary }: { summary: CycleSummary }) {
  const text = useCycleText()
  const sentence = text.next(summary)
  const when = text.nextWhen(summary)
  if (!sentence) return null
  return (
    <>
      {sentence}
      {when && <span className="text-muted"> · {when}</span>}
    </>
  )
}
