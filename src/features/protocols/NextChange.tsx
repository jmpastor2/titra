import { useCycleText } from './cycleText'
import type { CycleSummary } from './cycleView'

/** "El lun 5 oct sube a 15 U · mañana": what changes next and how soon. */
export function NextChange({
  summary,
  withWhen = true,
}: {
  summary: CycleSummary
  /** Add how soon, after the sentence; off where something else already says it. */
  withWhen?: boolean
}) {
  const text = useCycleText()
  const sentence = text.next(summary)
  const when = withWhen ? text.nextWhen(summary) : null
  if (!sentence) return null
  return (
    <>
      {sentence}
      {when && <span className="text-muted"> · {when}</span>}
    </>
  )
}
