/**
 * "Qué medir para saberlo": one list for every active protocol, each thing once. A check shows what
 * already has records since the cycle began; the rest is a tap away from being logged. Labs and
 * notes cannot be counted here, so they only name the place they go.
 */
import { clsx } from 'clsx'
import { Check, ChevronRight, FlaskConical, StickyNote } from 'lucide-react'
import type { MeasureItem } from '@/content/outlook'
import { fmtDate } from '@/lib/format'
import type { MeasureStatus } from './outlookModel'
import { measureProgress } from './outlookModel'
import type { Fmt } from './outlookFormat'

export function MeasureSection({
  f,
  status,
  since,
  readOnly,
  onPick,
}: {
  f: Fmt
  status: readonly MeasureStatus[]
  since: Date
  readOnly: boolean
  onPick: (m: MeasureItem) => void
}) {
  const { t, pick } = f
  if (status.length === 0) return null
  const { done, total } = measureProgress(status)
  return (
    <div className="card fade-up overflow-hidden">
      <div className="px-4 pb-3 pt-3.5">
        {total > 0 && (
          <>
            <div className="readout text-[13px] font-semibold text-ink">
              {t('outlook.measure.progress', { done, total })}
            </div>
            <div
              role="progressbar"
              aria-label={t('outlook.measure.progress', { done, total })}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              className="mt-2 flex gap-1"
            >
              {Array.from({ length: total }, (_, i) => (
                <span
                  // The segments are positions in a row of `total`, none more than another.
                  // oxlint-disable-next-line react/no-array-index-key
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: i < done ? 'var(--signal)' : 'var(--panel-3)' }}
                />
              ))}
            </div>
          </>
        )}
        <p className="mt-2 text-[11.5px] text-muted">
          {t('outlook.measure.since', { date: fmtDate(since, f.locale, 'd MMM') })}
        </p>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {status.map(({ item, count }) => {
          const actionable = !readOnly && item.target.type !== 'note'
          const body = (
            <>
              <MeasureMark count={count} lab={item.target.type === 'lab'} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium leading-snug text-ink">
                  {pick(item.label)}
                </span>
                {item.hint && (
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                    {pick(item.hint)}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                {count !== null ? (
                  <span
                    className={
                      count > 0
                        ? 'readout text-[11.5px] text-signal'
                        : clsx(
                            'text-[11.5px]',
                            actionable ? 'font-semibold text-signal' : 'text-muted',
                          )
                    }
                  >
                    {count > 0
                      ? t('outlook.measure.count', { count })
                      : actionable
                        ? t('outlook.measure.log')
                        : t('outlook.measure.none')}
                  </span>
                ) : (
                  <span className="text-[11.5px] text-muted">
                    {item.target.type === 'lab'
                      ? t('outlook.measure.lab')
                      : t('outlook.measure.note')}
                  </span>
                )}
              </span>
              {actionable && <ChevronRight className="size-4 shrink-0 text-muted" />}
            </>
          )
          return (
            <li key={item.id}>
              {actionable ? (
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal/60 active:bg-panel-2"
                >
                  {body}
                </button>
              ) : (
                <div className="flex min-h-12 items-center gap-3 px-4 py-2.5">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A check when there are records, an empty circle when there are none, the place for a lab or a note. */
function MeasureMark({ count, lab }: { count: number | null; lab: boolean }) {
  if (count === null) {
    const Icon = lab ? FlaskConical : StickyNote
    return <Icon aria-hidden className="size-5 shrink-0 text-muted" />
  }
  return count > 0 ? (
    <span
      aria-hidden
      className="grid size-5 shrink-0 place-items-center rounded-full bg-signal text-signal-ink"
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span aria-hidden className="size-5 shrink-0 rounded-full border-2 border-line-strong" />
  )
}
