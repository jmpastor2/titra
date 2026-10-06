/**
 * The adherence calendar: twelve weeks across, Monday to Sunday down, each day tinted by the
 * share of its scheduled doses that were taken. The cells are small on purpose (it is one
 * picture), so they are not controls: the whole grid is the target. A tap or a drag picks the
 * day under the finger and says what happened that day below the grid; the arrow keys do the
 * same. The bucketing is in heatmap.ts.
 */
import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LegendItem, LegendList } from '@/features/exposure/CardParts'
import { useLocale } from '@/lib/useLocale'
import { cellAt, monthStarts, type HeatCell, type HeatGrid, type HeatLevel } from './heatmap'
import { describeCell } from './heatmapText'

const GAP = 3

const LEVEL_BG: Record<HeatLevel, string> = {
  none: 'color-mix(in oklab, var(--panel-3) 55%, transparent)',
  missed: 'var(--danger-soft)',
  low: 'color-mix(in oklab, var(--signal) 32%, var(--panel-3))',
  mid: 'color-mix(in oklab, var(--signal) 64%, var(--panel-3))',
  full: 'var(--signal)',
}
const MISSED_RING = 'inset 0 0 0 1px color-mix(in oklab, var(--danger) 60%, transparent)'
const FUTURE_RING = 'inset 0 0 0 1px var(--line)'

interface Pick {
  week: number
  day: number
}

function cellStyle(cell: HeatCell, selected: boolean) {
  return {
    background: cell.future ? 'transparent' : LEVEL_BG[cell.level],
    boxShadow: cell.future ? FUTURE_RING : cell.level === 'missed' ? MISSED_RING : undefined,
    outline: selected
      ? '2px solid var(--ink)'
      : cell.today
        ? '1.5px solid var(--ink-2)'
        : undefined,
    outlineOffset: selected || cell.today ? 1 : undefined,
  }
}

export function AdherenceHeatmap({ grid }: { grid: HeatGrid }) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const dateLocale = locale === 'es' ? es : enUS
  // The narrow weekday of the CLDR: "L M X J V S D" in Spanish, which date-fns does not give.
  const weekdayLetter = useMemo(() => {
    const names = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'narrow',
    })
    return (d: Date) => names.format(d)
  }, [locale])
  const frame = useRef<HTMLDivElement>(null)
  const pinned = useRef(false)
  const [picked, setPicked] = useState<Pick | null>(null)
  const weeks = grid.weeks.length

  const months = useMemo(() => monthStarts(grid), [grid])
  const weekdays = grid.weeks[0] ?? []
  const counts = useMemo(() => {
    const all = grid.weeks.flat().filter((c) => !c.future)
    return {
      full: all.filter((c) => c.level === 'full').length,
      some: all.filter((c) => c.level === 'low' || c.level === 'mid').length,
      missed: all.filter((c) => c.level === 'missed').length,
    }
  }, [grid])

  const cell = picked ? cellAt(grid, picked.week, picked.day) : null
  const reading = cell ? describeCell(cell, locale, t) : ''

  // A day picked by touch stays until the next tap somewhere else.
  useEffect(() => {
    if (!picked) return
    const away = (e: Event) => {
      if (pinned.current && !frame.current?.contains(e.target as Node)) setPicked(null)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [picked])

  function pick(clientX: number, clientY: number) {
    const box = frame.current?.getBoundingClientRect()
    if (!box || box.width === 0 || box.height === 0) return
    const week = Math.floor(((clientX - box.left) / box.width) * weeks)
    const day = Math.floor(((clientY - box.top) / box.height) * 7)
    if (cellAt(grid, week, day)) setPicked({ week, day })
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // The arrow keys begin at today, in the last week.
    const todayAt = grid.weeks[weeks - 1]?.findIndex((c) => c.today) ?? -1
    const from = picked ?? { week: weeks - 1, day: Math.max(0, todayAt) }
    const move = (dw: number, dd: number) => {
      const week = Math.min(weeks - 1, Math.max(0, from.week + dw))
      const day = Math.min(6, Math.max(0, from.day + dd))
      setPicked(picked ? { week, day } : from)
    }
    if (e.key === 'ArrowRight') move(1, 0)
    else if (e.key === 'ArrowLeft') move(-1, 0)
    else if (e.key === 'ArrowDown') move(0, 1)
    else if (e.key === 'ArrowUp') move(0, -1)
    else if (e.key === 'Escape') setPicked(null)
    else return
    e.preventDefault()
  }

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      pinned.current = e.pointerType !== 'mouse'
      pick(e.clientX, e.clientY)
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' || e.buttons) pick(e.clientX, e.clientY)
    },
    onPointerLeave: (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') setPicked(null)
    },
    onBlur: () => {
      if (!pinned.current) setPicked(null)
    },
  }

  return (
    <figure className="mx-auto max-w-[380px]">
      <div className="grid grid-cols-[14px_1fr]" style={{ columnGap: 6 }}>
        <span aria-hidden />
        <div
          aria-hidden
          className="grid"
          style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, columnGap: GAP }}
        >
          {months.map((m, i) => (
            <span
              key={grid.weeks[i]?.[0]?.day.getTime() ?? i}
              className="whitespace-nowrap text-[11px] leading-4 text-muted"
            >
              {m ? format(m, 'MMM', { locale: dateLocale }) : ''}
            </span>
          ))}
        </div>

        <div
          aria-hidden
          className="mt-1 grid text-[10.5px] text-muted"
          style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', rowGap: GAP }}
        >
          {weekdays.map((c) => (
            <span key={c.day.getTime()} className="grid place-items-center">
              {weekdayLetter(c.day)}
            </span>
          ))}
        </div>
        <div
          ref={frame}
          role="img"
          tabIndex={0}
          aria-label={t('progress.consistency.aria', { weeks, ...counts })}
          className="mt-1 grid touch-pan-y select-none rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
          style={{
            gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
            gap: GAP,
          }}
          onKeyDown={onKeyDown}
          {...handlers}
        >
          {grid.weeks.flatMap((week, w) =>
            week.map((c, d) => (
              <span
                key={c.day.getTime()}
                data-level={c.future ? 'future' : c.level}
                className="aspect-square rounded-[4px]"
                style={cellStyle(c, picked?.week === w && picked.day === d)}
              />
            )),
          )}
        </div>
      </div>

      <p
        className={`mt-2.5 min-h-8 text-[11.5px] leading-snug ${cell ? 'font-semibold text-ink' : 'text-muted'}`}
      >
        {reading || t('progress.consistency.hint')}
      </p>
      {/* Said aloud when the arrow keys move the pick; the line above is for the eyes. */}
      <span className="sr-only" aria-live="polite">
        {reading}
      </span>

      <figcaption>
        <LegendList>
          {(['full', 'some', 'missed', 'none'] as const).map((key) => (
            <LegendItem
              key={key}
              swatch={
                <span
                  className="size-2.5 rounded-[3px]"
                  style={{
                    background: LEVEL_BG[key === 'some' ? 'mid' : key],
                    boxShadow: key === 'missed' ? MISSED_RING : undefined,
                  }}
                />
              }
            >
              {t(`progress.consistency.legend.${key}`)}
            </LegendItem>
          ))}
        </LegendList>
      </figcaption>
    </figure>
  )
}
