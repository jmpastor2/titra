import { useTranslation } from 'react-i18next'

/**
 * U-100 insulin syringe with the fill level marked. 100 units across the barrel;
 * major ticks every 10 U, minor every 2 U.
 */
export function SyringeDiagram({ units, max = 100 }: { units: number; max?: number }) {
  const { t } = useTranslation()
  const clamped = Math.max(0, Math.min(max, units))
  const W = 320
  const H = 74
  const bx = 34 // barrel start
  const bw = 240 // barrel width
  const by = 24
  const bh = 22
  const fill = (clamped / max) * bw

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${clamped} ${t('calculator.units')}`}
      >
        {/* needle */}
        <rect
          x={bx + bw + 6}
          y={by + bh / 2 - 1}
          width={36}
          height={2}
          rx={1}
          fill="var(--muted)"
        />
        {/* hub */}
        <rect x={bx + bw} y={by + 4} width={8} height={bh - 8} rx={2} fill="var(--muted)" />
        {/* barrel */}
        <rect
          x={bx}
          y={by}
          width={bw}
          height={bh}
          rx={4}
          fill="var(--panel-2)"
          stroke="var(--line)"
          strokeWidth={1.5}
        />
        {/* fill */}
        <rect x={bx} y={by} width={fill} height={bh} rx={4} fill="var(--signal)" opacity={0.85} />
        {/* plunger */}
        <rect x={bx + fill - 3} y={by - 4} width={4} height={bh + 8} rx={2} fill="var(--ink-2)" />
        <rect x={bx - 22} y={by + 2} width={20} height={bh - 4} rx={3} fill="var(--panel-3)" />
        {/* ticks */}
        {Array.from({ length: max / 2 + 1 }, (_, i) => {
          const u = i * 2
          const x = bx + (u / max) * bw
          const major = u % 10 === 0
          return (
            <line
              key={u}
              x1={x}
              x2={x}
              y1={by + bh}
              y2={by + bh + (major ? 7 : 4)}
              stroke="var(--muted)"
              strokeWidth={major ? 1.2 : 0.8}
            />
          )
        })}
        {Array.from({ length: max / 20 + 1 }, (_, i) => {
          const u = i * 20
          const x = bx + (u / max) * bw
          return (
            <text
              key={u}
              x={x}
              y={by + bh + 20}
              textAnchor="middle"
              fontSize={9}
              fill="var(--muted)"
              fontFamily="var(--font-mono)"
            >
              {u}
            </text>
          )
        })}
        {/* value label */}
        <text
          x={bx + fill}
          y={by - 9}
          textAnchor={clamped > max * 0.85 ? 'end' : 'middle'}
          fontSize={12}
          fontWeight={700}
          fill="var(--signal)"
          fontFamily="var(--font-mono)"
        >
          {clamped} U
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-[11.5px] text-muted">
        {t('calculator.unitsRounded')} · U-100
      </figcaption>
    </figure>
  )
}
