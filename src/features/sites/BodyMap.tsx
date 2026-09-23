import { useTranslation } from 'react-i18next'

interface Spot {
  id: string
  cx: number
  cy: number
}

/** Positions on a simplified front-facing torso silhouette (viewBox 0 0 200 260). */
const SPOTS: Spot[] = [
  { id: 'arm_l', cx: 36, cy: 74 },
  { id: 'arm_r', cx: 164, cy: 74 },
  { id: 'abd_ul', cx: 84, cy: 116 },
  { id: 'abd_ur', cx: 116, cy: 116 },
  { id: 'abd_ll', cx: 84, cy: 142 },
  { id: 'abd_lr', cx: 116, cy: 142 },
  { id: 'glute_l', cx: 72, cy: 168 },
  { id: 'glute_r', cx: 128, cy: 168 },
  { id: 'thigh_l', cx: 78, cy: 210 },
  { id: 'thigh_r', cx: 122, cy: 210 },
]

export function BodyMap({
  usage,
  maxUse,
  suggestedId,
}: {
  usage: Record<string, number>
  maxUse: number
  suggestedId?: string
}) {
  const { t } = useTranslation()
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 200 260"
        className="mx-auto block h-[280px]"
        role="img"
        aria-label={t('sites.title')}
      >
        {/* silhouette */}
        <g fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.5">
          <circle cx="100" cy="26" r="16" />
          <path d="M76 46 h48 q14 0 16 12 l6 42 q1 8 -7 8 h-6 l-4 -30 v90 q0 6 -6 6 h-8 l-6 -66 -6 66 h-8 q-6 0 -6 -6 v-90 l-4 30 h-6 q-8 0 -7 -8 l6 -42 q2 -12 16 -12 z" />
          <path d="M84 158 h32 l8 92 q1 8 -7 8 h-10 q-6 0 -6 -7 l-1 -60 -1 60 q0 7 -6 7 h-10 q-8 0 -7 -8 z" />
        </g>
        {/* injection spots */}
        {SPOTS.map((s) => {
          const count = usage[s.id] ?? 0
          const intensity = count / maxUse
          const suggested = s.id === suggestedId
          return (
            <g key={s.id}>
              {suggested && (
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={13}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              )}
              <circle
                cx={s.cx}
                cy={s.cy}
                r={9}
                fill={count === 0 ? 'var(--surface)' : 'var(--chart-3)'}
                fillOpacity={count === 0 ? 1 : 0.25 + intensity * 0.75}
                stroke={suggested ? 'var(--brand)' : 'var(--line)'}
                strokeWidth={suggested ? 2 : 1.5}
              />
              <text
                x={s.cx}
                y={s.cy + 3.5}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fill="var(--ink)"
                fontFamily="var(--font-mono)"
              >
                {count || ''}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-1 flex items-center justify-center gap-4 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border border-line bg-surface" />{' '}
          {t('sites.neverUsed')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-[var(--chart-3)]" />{' '}
          {t('sites.uses', { count: maxUse })}
        </span>
      </figcaption>
    </figure>
  )
}
