import { useId } from 'react'
import { syringeScale, type SyringeCapacity } from '@/domain/dosing/draw'

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

/**
 * U-100 insulin syringe drawn to scale: 0 next to the needle, marks printed as on the
 * real barrel for 0.3, 0.5 and 1 mL syringes. Stacked loads keep their own colour so a
 * mixed syringe shows what came from each vial.
 */
export function Syringe({
  capacity,
  loads,
  label,
  className,
}: {
  capacity: SyringeCapacity
  loads: readonly SyringeLoad[]
  label: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const [minor, major, labelEvery] = syringeScale(capacity)
  const x = (u: number) => BX + (Math.max(0, Math.min(capacity, u)) / capacity) * BW
  const total = loads.at(-1)?.to ?? 0
  const fillX = x(total)
  const rodEnd = W - 10

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

      {/* plunger rod and thumb rest, behind the barrel */}
      <rect
        x={fillX + STOPPER_W - 2}
        y={BY + BH / 2 - 4}
        width={Math.max(0, rodEnd - fillX - STOPPER_W)}
        height={8}
        rx={2}
        fill="var(--panel-3)"
        stroke="var(--line)"
      />
      <rect
        x={rodEnd - 4}
        y={BY + 2}
        width={7}
        height={BH - 4}
        rx={2.5}
        fill="var(--panel-3)"
        stroke="var(--line-strong)"
      />

      {/* barrel */}
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

      {/* liquid, one band per load */}
      <g clipPath={`url(#barrel-${uid})`}>
        {loads.map((l, i) => (
          <rect
            key={`${l.from}-${l.to}`}
            x={x(l.from)}
            y={BY}
            width={Math.max(0, x(l.to) - x(l.from))}
            height={BH}
            fill={l.color}
            opacity={i % 2 === 0 ? 0.92 : 0.62}
            style={{ filter: `drop-shadow(0 0 5px ${l.color})` }}
          />
        ))}
        {loads.slice(0, -1).map((l) => (
          <line
            key={l.to}
            x1={x(l.to)}
            x2={x(l.to)}
            y1={BY}
            y2={BY + BH}
            stroke="var(--bg)"
            strokeWidth={1.2}
            strokeDasharray="2 2"
          />
        ))}
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
          fill="#1b2527"
          stroke="#000"
          strokeOpacity={0.4}
        />
        <line x1={fillX + 3.5} x2={fillX + 3.5} y1={BY + 3} y2={BY + BH - 3} stroke="#3a4a4d" />
        <line x1={fillX + 6.5} x2={fillX + 6.5} y1={BY + 3} y2={BY + BH - 3} stroke="#3a4a4d" />
      </g>

      {/* printed scale */}
      {Array.from({ length: Math.floor(capacity / minor) + 1 }, (_, i) => {
        const u = i * minor
        const isMajor = u % major === 0
        return (
          <line
            key={u}
            x1={x(u)}
            x2={x(u)}
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
            key={u}
            x={x(u)}
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

      {/* load marks: where the plunger stops after each vial */}
      {loads.map((l, i) => {
        const mx = x(l.to)
        return (
          <g key={`${l.from}-${l.to}`}>
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
