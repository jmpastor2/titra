import { clsx } from 'clsx'
import { addDays } from 'date-fns'
import { Pause } from 'lucide-react'
import { useCallback, useMemo, useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Badge, SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import type { DoseLabel } from './doseLabel'
import { isCurrent } from './model'
import type { Timeline, TimelineBlock, TimelineLane } from './timeline'

/** Width of a week on screen. A one-week step is then a 44 px target. */
const WEEK_PX = 46
const PAD_PX = 14
const HEADER_H = 36
const BAR_H = 48
const RULER_H = 18
/** A step this many weeks wide has room for its unit, a rest for its name. */
const WIDE_WEEKS = 2
const ROOMY_WEEKS = 2.2

const px = (weeks: number) => PAD_PX + weeks * WEEK_PX

const FADE_OUT = 'linear-gradient(to right, #000 calc(100% - 64px), transparent)'
const HATCH =
  'repeating-linear-gradient(135deg, color-mix(in oklab, var(--muted) 45%, transparent) 0 1.5px, transparent 1.5px 7px)'

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  )
}

/**
 * The cycles on one weekly axis you scroll sideways: a lane per protocol, a block per step
 * (colour is the substance, intensity the dose, hatching a rest), the week of the cycle under
 * each block and a line for today. Tapping a lane or a block opens its sheet.
 */
export function CyclesTimeline({
  timeline,
  labels,
  onSelect,
}: {
  timeline: Timeline
  /** The dose of each block, by block key; missing for a rest. */
  labels: ReadonlyMap<string, DoseLabel>
  onSelect: (laneId: string, stepIndex: number) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const scroller = useRef<HTMLDivElement | null>(null)
  const centred = useRef(false)
  // The week a new month begins in carries its name, so the axis reads as a calendar.
  const monthStarts = useMemo(() => new Set(timeline.months.map((m) => m.x)), [timeline.months])
  const todayLeft = useCallback(
    (el: HTMLElement) => Math.max(0, px(timeline.today) - el.clientWidth / 2),
    [timeline.today],
  )

  // The strip opens with the current week in the middle; later updates keep the scroll.
  const setScroller = useCallback(
    (el: HTMLDivElement | null) => {
      scroller.current = el
      if (el && !centred.current) {
        centred.current = true
        el.scrollLeft = todayLeft(el)
      }
    },
    [todayLeft],
  )

  function goToday() {
    const el = scroller.current
    if (!el) return
    const left = todayLeft(el)
    if (typeof el.scrollTo === 'function' && !reducedMotion())
      el.scrollTo({ left, behavior: 'smooth' })
    else el.scrollLeft = left
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <div className="spec mb-1">01</div>
          <h2 className="text-[16px] font-semibold text-ink">{t('cycles.timeline.title')}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{t('cycles.timeline.hint')}</p>
        </div>
        <Button
          size="sm"
          variant="soft"
          // The pill stays slim; its touch area is a full 44 px.
          className="relative shrink-0 whitespace-nowrap before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
          onClick={goToday}
        >
          {t('cycles.timeline.goToday')}
        </Button>
      </header>

      <div
        ref={setScroller}
        role="group"
        aria-label={t('cycles.timeline.aria')}
        className="mt-3 overflow-x-auto overscroll-x-contain pb-1"
      >
        <div className="relative" style={{ width: px(timeline.weeks) + PAD_PX }}>
          {/* a hairline on every Monday */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0"
            style={{
              left: PAD_PX,
              right: PAD_PX,
              backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px)',
              backgroundSize: `${WEEK_PX}px 100%`,
            }}
          />

          <div className="relative" style={{ height: HEADER_H }} aria-hidden>
            {timeline.ticks.map((tick) => {
              const month = monthStarts.has(tick.x)
              return (
                <span
                  key={tick.x}
                  className={clsx(
                    'readout absolute bottom-1 whitespace-nowrap text-[10px]',
                    tick.current
                      ? 'font-bold text-signal'
                      : month
                        ? 'font-semibold text-ink-2'
                        : 'text-muted',
                  )}
                  style={{ left: px(tick.x) + 4 }}
                >
                  {fmtDate(tick.date, locale, month ? 'd MMM' : 'd')}
                </span>
              )
            })}
          </div>

          {timeline.lanes.map((lane) => (
            <Lane key={lane.id} lane={lane} labels={labels} onSelect={onSelect} />
          ))}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-20 w-px bg-signal"
            style={{ left: px(timeline.today), boxShadow: '0 0 10px var(--signal)' }}
          >
            <span className="spec absolute left-1 top-1 rounded-full bg-signal px-1.5 py-px text-[9px] text-signal-ink">
              {t('cycles.timeline.today')}
            </span>
          </div>
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pb-3 pt-2 text-[11px] text-muted">
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-3 w-5 rounded-[3px] border border-dashed border-line-strong"
            style={{ backgroundImage: HATCH }}
          />
          {t('cycles.timeline.legendRest')}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-3 w-8 rounded-[3px]"
            style={{
              background:
                'linear-gradient(90deg, color-mix(in oklab, var(--signal) 20%, var(--panel)), color-mix(in oklab, var(--signal) 60%, var(--panel)))',
            }}
          />
          {t('cycles.timeline.legendDose')}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-3 w-5 rounded-[3px] border border-dashed border-signal/60"
          />
          {t('cycles.timeline.legendPlanned')}
        </li>
      </ul>
      {timeline.hidden > 0 && (
        <p className="px-4 pb-3 text-[11.5px] text-muted">
          {t('cycles.timeline.older', { count: timeline.hidden })}
        </p>
      )}
    </div>
  )
}

function Lane({
  lane,
  labels,
  onSelect,
}: {
  lane: TimelineLane
  labels: ReadonlyMap<string, DoseLabel>
  onSelect: (laneId: string, stepIndex: number) => void
}) {
  const { t } = useTranslation()
  const color = compoundColor(lane.compoundId)
  return (
    <div className={clsx('relative mt-2', !isCurrent(lane.status) && 'opacity-80')}>
      <button
        type="button"
        onClick={() => onSelect(lane.id, lane.focusStep)}
        className="sticky left-3 z-10 flex min-h-9 w-fit max-w-[min(22rem,calc(100vw-2.75rem))] items-center gap-1.5 rounded-full border border-line bg-panel/90 px-2.5 backdrop-blur-sm outline-none before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] focus-visible:ring-2 focus-visible:ring-signal/60"
      >
        {lane.compoundIds.map((id) => (
          <SubstanceDot key={id} color={compoundColor(id)} />
        ))}
        <span className="truncate text-[12.5px] font-semibold">{lane.name}</span>
        {(lane.siblings > 1 || lane.endedWeeksAgo !== null) && (
          <span className="spec shrink-0">
            {[
              lane.siblings > 1 ? t('cycles.cycleN', { n: lane.ordinal }) : null,
              lane.endedWeeksAgo !== null && lane.endedWeeksAgo >= 2
                ? t('cycles.timeline.endedAgo', { count: lane.endedWeeksAgo })
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
        {lane.status === 'paused' && (
          <Badge tone="warn" className="shrink-0">
            {t('protocols.statuses.paused')}
          </Badge>
        )}
      </button>

      <div className="relative mt-1.5" style={{ height: BAR_H }}>
        {lane.blocks.map((block) => (
          <Block
            key={block.key}
            lane={lane}
            block={block}
            color={color}
            label={labels.get(block.key)}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="relative" style={{ height: RULER_H }} aria-hidden>
        {lane.ruler.map((w) => (
          <span
            key={w.x}
            className={clsx(
              'readout absolute top-1 text-center text-[10px]',
              w.current ? 'font-bold text-signal' : 'text-muted',
            )}
            style={{ left: px(w.x), width: WEEK_PX }}
          >
            {w.n ?? '·'}
          </span>
        ))}
      </div>
    </div>
  )
}

function Block({
  lane,
  block,
  color,
  label,
  onSelect,
}: {
  lane: TimelineLane
  block: TimelineBlock
  color: string
  label: DoseLabel | undefined
  onSelect: (laneId: string, stepIndex: number) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const date = (d: Date) => fmtDate(d, locale, 'd MMM')
  const wide = block.w >= WIDE_WEEKS
  const last = block.endsOn ? addDays(block.endsOn, -1) : null

  const aria = block.pause
    ? t('cycles.timeline.blockRest', {
        name: lane.name,
        from: date(block.startsOn),
        to: last ? date(last) : '',
      })
    : last
      ? t('cycles.timeline.block', {
          name: lane.name,
          dose: label?.full ?? '',
          from: date(block.startsOn),
          to: date(last),
        })
      : t('cycles.timeline.blockOpen', {
          name: lane.name,
          dose: label?.full ?? '',
          from: date(block.startsOn),
        })

  const style: CSSProperties = block.pause
    ? {
        backgroundColor: 'var(--panel-2)',
        backgroundImage: HATCH,
        borderColor: 'var(--line-strong)',
      }
    : {
        background: `color-mix(in oklab, ${color} ${20 + 40 * block.intensity}%, var(--panel))`,
        borderColor: `color-mix(in oklab, ${color} 60%, transparent)`,
        boxShadow:
          block.state === 'current'
            ? `0 0 0 1.5px ${color}, 0 0 14px color-mix(in oklab, ${color} 50%, transparent)`
            : undefined,
      }
  if (block.open) {
    // The last step has no end: it fades out to the right.
    style.maskImage = FADE_OUT
    style.WebkitMaskImage = FADE_OUT
  }

  const second = block.pause
    ? null
    : [label?.units, block.open ? t('cycles.timeline.maintenance') : null]
        .filter(Boolean)
        .join(' · ')

  return (
    <button
      type="button"
      aria-label={aria}
      onClick={() => onSelect(lane.id, block.stepIndex)}
      className={clsx(
        'absolute top-0 flex h-full flex-col justify-center rounded-[10px] border outline-none focus-visible:ring-2 focus-visible:ring-signal',
        block.state === 'future' && 'border-dashed',
        wide ? 'px-1.5' : 'items-center px-0.5',
      )}
      style={{ left: px(block.x) + 1, width: block.w * WEEK_PX - 2, ...style }}
    >
      {/* In a wide step the label slides along with the scroll, so a long block stays readable. */}
      <span
        className={clsx(
          'flex min-w-0 flex-col',
          wide
            ? 'sticky left-1.5 w-fit max-w-full self-start text-left'
            : 'items-center text-center',
        )}
      >
        {block.pause ? (
          block.w >= ROOMY_WEEKS ? (
            <span className="spec truncate rounded-full bg-panel/85 px-2 py-0.5 text-[10px]">
              {t('cycles.timeline.rest')}
              {block.w >= 3 && ` · ${t('common.weeks', { count: Math.round(block.w) })}`}
            </span>
          ) : (
            <Pause aria-hidden className="size-3.5 text-muted" />
          )
        ) : (
          <>
            <span className="readout block max-w-full truncate text-[12.5px] font-semibold leading-tight text-ink">
              {label ? (wide ? label.short : label.value) : ''}
            </span>
            {second && (
              <span
                className={clsx(
                  'readout block max-w-full truncate leading-tight text-ink-2',
                  wide ? 'text-[10px]' : 'text-[9.5px]',
                )}
              >
                {second}
              </span>
            )}
          </>
        )}
      </span>
    </button>
  )
}
