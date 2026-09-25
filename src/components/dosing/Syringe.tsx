import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { syringeScale, type SyringeCapacity } from '@/domain/dosing/draw'
import {
  bandEnd,
  fillTimeline,
  parseSpans,
  prefersReducedMotion,
  spansKey,
  unitsAt,
} from './syringeFill'

export interface SyringeLoad {
  from: number
  to: number
  color: string
}

const W = 360
const H = 104
const NEEDLE_X = 6
const HUB_X = 40
const BX = 54 // barrel start = the 0 mark, right next to the needle
const BW = 232
const BY = 38
const BH = 30
const STOPPER_W = 10
/** Thumb rest travel: just past the finger flange when empty, at the edge when full. */
const THUMB_EMPTY = BX + BW + 10
const THUMB_FULL = W - 10
/** Rubber is black whatever the theme, like on the real thing. */
const RUBBER = '#1b2527'
const RUBBER_RIB = '#3a4a4d'

const xOf = (u: number, capacity: number) =>
  BX + (Math.max(0, Math.min(capacity, u)) / capacity) * BW

/**
 * Tweens the plunger mark towards `target` with requestAnimationFrame. Returns the
 * mark to draw this frame; jumps straight to the target when `enabled` is false.
 */
function useFillTween(target: number, key: string, enabled: boolean): number {
  const [shown, setShown] = useState(enabled ? 0 : target)
  const shownRef = useRef(shown)

  useEffect(() => {
    const from = shownRef.current
    if (!enabled || from === target) {
      shownRef.current = target
      setShown(target)
      return
    }
    const timeline = fillTimeline(from, target, parseSpans(key))
    let raf = 0
    let t0 = -1
    const tick = (now: number) => {
      if (t0 < 0) t0 = now
      const u = unitsAt(timeline, now - t0)
      shownRef.current = u
      setShown(u)
      if (now - t0 < timeline.duration) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, key, enabled])

  return enabled ? shown : target
}

/**
 * U-100 insulin syringe drawn to scale: 0 next to the needle, marks printed as on the
 * real barrel for 0.3, 0.5 and 1 mL syringes. Stacked loads keep their own colour so a
 * mixed syringe shows what came from each vial. The plunger draws each load up in turn
 * when the syringe appears and whenever the dose changes.
 */
export function Syringe({
  capacity,
  loads,
  label,
  className,
  animate = true,
}: {
  capacity: SyringeCapacity
  loads: readonly SyringeLoad[]
  label: string
  className?: string
  /** Draw-up animation; always off with prefers-reduced-motion. */
  animate?: boolean
}) {
  const uid = useId().replace(/[^\w-]/g, '')
  const total = loads.at(-1)?.to ?? 0
  const target = Math.max(0, Math.min(capacity, total))
  const units = useFillTween(target, spansKey(loads), animate && !prefersReducedMotion())
  const moving = units !== target

  const x = (u: number) => xOf(u, capacity)
  const fillX = x(units)
  const thumbX =
    THUMB_EMPTY + (Math.max(0, Math.min(capacity, units)) / capacity) * (THUMB_FULL - THUMB_EMPTY)
  const reached = (u: number) => units >= Math.min(u, capacity) - 1e-6

  // The printed scale never changes during a tween: build it once per barrel.
  const scale = useMemo(() => {
    const [minor, major, labelEvery] = syringeScale(capacity)
    return (
      <>
        {Array.from({ length: Math.floor(capacity / minor) + 1 }, (_, i) => {
          const u = i * minor
          const isMajor = u % major === 0
          return (
            <line
              key={`t${u}`}
              x1={xOf(u, capacity)}
              x2={xOf(u, capacity)}
              y1={BY}
              y2={BY + (isMajor ? 11 : 6)}
              stroke="var(--ink)"
              strokeOpacity={isMajor ? 0.75 : 0.4}
              strokeWidth={isMajor ? 1.1 : 0.8}
            />
          )
        })}
        {Array.from({ length: Math.floor(capacity / labelEvery) + 1 }, (_, i) => {
          const u = i * labelEvery
          return (
            <text
              key={`l${u}`}
              x={xOf(u, capacity)}
              y={BY - 7}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--muted)"
              fontFamily="var(--font-mono)"
            >
              {u}
            </text>
          )
        })}
      </>
    )
  }, [capacity])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--panel-3)" />
          <stop offset="0.5" stopColor="var(--panel-2)" />
          <stop offset="1" stopColor="var(--panel-3)" />
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        {/* wet edge: the liquid brightens where it meets the stopper */}
        <linearGradient id={`edge-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.26" />
        </linearGradient>
        <clipPath id={`barrel-${uid}`}>
          <rect x={BX} y={BY} width={BW} height={BH} rx={7} />
        </clipPath>
      </defs>

      {/* needle, bevel and hub */}
      <path
        d={`M${NEEDLE_X} ${BY + BH / 2} L${NEEDLE_X + 6} ${BY + BH / 2 - 1.6} L${HUB_X} ${BY + BH / 2 - 1.1} L${HUB_X} ${BY + BH / 2 + 1.1} L${NEEDLE_X + 6} ${BY + BH / 2 + 1.1} Z`}
        fill="var(--muted)"
      />
      <rect
        x={HUB_X}
        y={BY + 7}
        width={BX - HUB_X + 2}
        height={BH - 14}
        rx={3}
        fill="var(--panel-3)"
        stroke="var(--line-strong)"
      />

      {/* plunger rod and thumb rest, behind the barrel; they travel with the stopper */}
      <rect
        x={fillX + STOPPER_W - 2}
        y={BY + BH / 2 - 4}
        width={Math.max(0, thumbX - fillX - STOPPER_W)}
        height={8}
        rx={2}
        fill="var(--panel-3)"
        stroke="var(--line)"
      />
      <rect
        x={thumbX - 4}
        y={BY + 2}
        width={7}
        height={BH - 4}
        rx={2.5}
        fill="var(--panel-3)"
        stroke="var(--line-strong)"
      />

      {/* barrel and finger flange */}
      <rect
        x={BX}
        y={BY}
        width={BW}
        height={BH}
        rx={7}
        fill={`url(#glass-${uid})`}
        stroke="var(--line-strong)"
        strokeWidth={1.2}
      />
      <rect
        x={BX + BW - 1}
        y={BY - 3}
        width={5}
        height={BH + 6}
        rx={1.5}
        fill="var(--panel-3)"
        stroke="var(--line-strong)"
      />

      <g clipPath={`url(#barrel-${uid})`}>
        {/* rod seen through the glass behind the stopper */}
        <rect
          x={fillX + STOPPER_W}
          y={BY + BH / 2 - 4}
          width={Math.max(0, BX + BW - fillX - STOPPER_W)}
          height={8}
          fill="var(--ink)"
          fillOpacity={0.06}
          stroke="var(--line)"
        />

        {/* liquid, one band per load, revealed as the plunger passes it */}
        {loads.map((l, i) => {
          const end = bandEnd(l, units, i === loads.length - 1)
          return (
            <rect
              key={`b${l.from}`}
              x={x(l.from)}
              y={BY}
              width={Math.max(0, x(end) - x(l.from))}
              height={BH}
              fill={l.color}
              opacity={i % 2 === 0 ? 0.92 : 0.62}
              style={{ filter: `drop-shadow(0 0 5px ${l.color})` }}
            />
          )
        })}
        {loads
          .slice(0, -1)
          .map((l) =>
            reached(l.to) ? (
              <line
                key={`s${l.to}`}
                x1={x(l.to)}
                x2={x(l.to)}
                y1={BY}
                y2={BY + BH}
                stroke="var(--bg)"
                strokeWidth={1.2}
                strokeDasharray="2 2"
              />
            ) : null,
          )}

        {/* meniscus against the stopper, and a few bubbles while drawing up */}
        {units > 0 && (
          <>
            <rect x={fillX - 6} y={BY} width={6} height={BH} fill={`url(#edge-${uid})`} />
            <path
              d={`M${fillX - 0.6} ${BY + 1.5} Q${fillX - 3.4} ${BY + BH / 2} ${fillX - 0.6} ${BY + BH - 1.5}`}
              fill="none"
              stroke="#fff"
              strokeOpacity={0.6}
              strokeWidth={1.1}
              strokeLinecap="round"
            />
            <g
              fill="#fff"
              style={{ opacity: moving ? 0.55 : 0, transition: 'opacity 320ms ease-out' }}
            >
              <circle cx={fillX - 5.5} cy={BY + 5.5} r={1.3} />
              <circle cx={fillX - 11} cy={BY + 9} r={0.9} />
              <circle cx={fillX - 16} cy={BY + 4.8} r={0.7} />
            </g>
          </>
        )}
        <rect x={BX} y={BY} width={BW} height={BH} fill={`url(#sheen-${uid})`} />
      </g>

      {/* rubber stopper at the fill mark */}
      <g>
        <rect
          x={fillX}
          y={BY + 1.5}
          width={STOPPER_W}
          height={BH - 3}
          rx={2.5}
          fill={RUBBER}
          stroke="#000"
          strokeOpacity={0.4}
        />
        <line x1={fillX + 3.5} x2={fillX + 3.5} y1={BY + 3} y2={BY + BH - 3} stroke={RUBBER_RIB} />
        <line x1={fillX + 6.5} x2={fillX + 6.5} y1={BY + 3} y2={BY + BH - 3} stroke={RUBBER_RIB} />
      </g>

      {/* printed scale */}
      {scale}

      {/* load marks: where the plunger stops after each vial, shown once it gets there */}
      {loads.map((l, i) => {
        const mx = x(l.to)
        return (
          <g
            key={`m${l.from}`}
            style={{ opacity: reached(l.to) ? 1 : 0, transition: 'opacity 180ms ease-out' }}
          >
            <path
              d={`M${mx} ${BY + BH + 3} l4.5 7 h-9 z`}
              fill={l.color}
              style={{ filter: `drop-shadow(0 0 3px ${l.color})` }}
            />
            {loads.length > 1 && (
              <>
                <circle
                  cx={mx}
                  cy={BY + BH + 20}
                  r={7}
                  fill="var(--panel)"
                  stroke={l.color}
                  strokeWidth={1.2}
                />
                <text
                  x={mx}
                  y={BY + BH + 23.2}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill="var(--ink)"
                  fontFamily="var(--font-mono)"
                >
                  {i + 1}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
